import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FlashCard from '../components/FlashCard'
import LocationModal from '../components/LocationModal'
import VenueLogo from '../components/VenueLogo'
import { buildFeed, spreadFeed, formatDistance, flashUrl } from '../utils/geo'
import artistsData from '../data/artists.json'

function preloadImages(feed, startIdx, count) {
  for (let i = startIdx; i < Math.min(startIdx + count, feed.length); i++) {
    if (feed[i]?.imageUrl) {
      const img = new Image()
      img.src = feed[i].imageUrl
    }
  }
}

export default function SwipeScreen({ userLocation, onLocationChange, onLikeFlash, onPassFlash, likedCount, onViewLiked, onGoHome }) {
  const [feed, setFeed] = useState(() =>
    buildFeed(artistsData, userLocation?.lat, userLocation?.lng)
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [matchedArtist, setMatchedArtist] = useState(null) // { handle, location, distance, profileImageUrl, bookingUrl }
  const [showLikeHint, setShowLikeHint] = useState(false)
  const likeCountsRef = useRef({})
  const shownMatchRef = useRef(new Set()) // artists we've already shown a match for
  const hintShownRef = useRef(false)

  const MATCH_THRESHOLD = 3

  // Rebuild feed when location changes
  useEffect(() => {
    setFeed(buildFeed(artistsData, userLocation?.lat, userLocation?.lng))
    setCurrentIdx(0)
    setShowDetail(false)
  }, [userLocation])

  const current = feed[currentIdx] ?? null
  const next1 = feed[currentIdx + 1] ?? null
  const next2 = feed[currentIdx + 2] ?? null

  useEffect(() => {
    preloadImages(feed, currentIdx + 1, 3)
  }, [currentIdx, feed])

  const advance = useCallback((direction) => {
    if (!current) return
    setShowDetail(false)

    if (direction === 'left') {
      const handle = current.artistHandle
      onPassFlash(current)
      // Remove all remaining flash from this artist — user said no
      setFeed(prev => [
        ...prev.slice(0, currentIdx + 1),
        ...prev.slice(currentIdx + 1).filter(item => item.artistHandle !== handle),
      ])
    }

    if (direction === 'right') {
      const handle = current.artistHandle
      const newCount = (likeCountsRef.current[handle] || 0) + 1
      likeCountsRef.current[handle] = newCount
      onLikeFlash(current)

      // Show the hint once on the very first like
      if (!hintShownRef.current) {
        hintShownRef.current = true
        setShowLikeHint(true)
        setTimeout(() => setShowLikeHint(false), 4000)
      }

      // Trigger match sheet on first time hitting the threshold
      if (newCount === MATCH_THRESHOLD && !shownMatchRef.current.has(handle)) {
        shownMatchRef.current.add(handle)
        setMatchedArtist({
          handle,
          likeCount: newCount,
          location: current.artistLocation,
          distance: current.artistDistance,
          profileImageUrl: current.artistProfileImageUrl,
          bookingUrl: current.bookingUrl,
        })
      }

      // Inject up to 2 more unseen flash from this artist, then re-spread upcoming
      setFeed(prev => {
        const upcoming = prev.slice(currentIdx + 1)
        const seenIds = new Set(prev.slice(0, currentIdx + 1).map(f => f.id))
        const upcomingIds = new Set(upcoming.map(f => f.id))
        const artistObj = artistsData.find(a => a.handle === handle)
        const toInject = (artistObj?.flash ?? [])
          .filter(f => !seenIds.has(f.id) && !upcomingIds.has(f.id))
          .slice(0, 2)
          .map(f => ({
            ...f,
            artistHandle: artistObj.handle,
            artistLocation: artistObj.location,
            artistLat: artistObj.lat,
            artistLng: artistObj.lng,
            artistDistance: current.artistDistance,
            bookingUrl: artistObj.bookingUrl,
            priceRange: artistObj.priceRange,
          }))

        if (toInject.length === 0) return prev
        // Prepend injected items so they surface soon, then spread to avoid consecutive repeats.
        // Pass current handle so the first upcoming card is never the same artist just shown.
        const newUpcoming = spreadFeed([...toInject, ...upcoming], handle)
        return [...prev.slice(0, currentIdx + 1), ...newUpcoming]
      })
    }

    setCurrentIdx(i => i + 1)
  }, [current, currentIdx, onLikeFlash])

  const handleLocationChange = (loc) => {
    onLocationChange(loc)
    setShowLocationModal(false)
  }

  const locationLabel = userLocation?.label || 'Nearby'

  // Empty state
  if (!current) {
    return (
      <div className="flex flex-col min-h-dvh bg-bg items-center justify-center px-8 text-center">
        <div className="text-4xl mb-5">🖤</div>
        <h2 className="text-xl font-bold text-white mb-2">You've seen it all</h2>
        <p className="text-[#888] text-sm mb-6">You've gone through all available flash</p>
        <button
          onClick={() => {
            setFeed(buildFeed(artistsData, userLocation?.lat, userLocation?.lng))
            setCurrentIdx(0)
            likeCountsRef.current = {}
          }}
          className="text-cream text-sm font-medium underline underline-offset-4"
        >
          Start over
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg select-none overflow-hidden" style={{ overscrollBehavior: 'none' }}>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-12 pb-3 max-w-[430px] mx-auto pointer-events-none">
        <motion.button whileTap={{ scale: 0.95 }} onClick={onGoHome} className="pointer-events-auto">
          <VenueLogo size="sm" />
        </motion.button>

        {/* Location pill */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLocationModal(true)}
          className="pointer-events-auto flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/8 border border-white/10 text-white text-xs font-medium"
        >
          <span>📍</span>
          <span className="max-w-[110px] truncate">{locationLabel}</span>
        </motion.button>

        {/* Liked pill */}
        <div className="pointer-events-auto relative">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onViewLiked}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/8 border border-white/10 text-white text-xs font-medium"
          >
            <span>❤️</span>
            <span>{likedCount}</span>
          </motion.button>

          {/* First-like hint tooltip */}
          <AnimatePresence>
            {showLikeHint && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                onClick={() => setShowLikeHint(false)}
                className="absolute top-full right-0 mt-2 w-44 rounded-2xl px-3 py-2.5 text-left cursor-pointer"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
              >
                {/* Arrow pointing up toward the pill */}
                <div
                  className="absolute -top-1.5 right-4 w-3 h-3 rotate-45"
                  style={{ background: '#1a1a1a', borderTop: '1px solid #2a2a2a', borderLeft: '1px solid #2a2a2a' }}
                />
                <p className="text-white text-xs font-semibold leading-snug">Review your likes & passes</p>
                <p className="text-[#666] text-[11px] mt-0.5 leading-snug">Tap here anytime to see what you've swiped on.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Card stack */}
      <div className="absolute inset-0 pt-24 pb-4">
        {/* Shadow cards */}
        {[next2, next1].filter(Boolean).map((item, i) => (
          <div
            key={item.id}
            className="absolute inset-x-3 top-24 bottom-4 rounded-2xl overflow-hidden"
            style={{
              transform: `scale(${0.93 + i * 0.03}) translateY(${(1 - i) * -8}px)`,
              transformOrigin: 'bottom center',
              background: '#111111',
              opacity: 0.5 + i * 0.25,
              zIndex: i + 1,
            }}
          />
        ))}

        {/* Active card */}
        <AnimatePresence>
          {current && (
            <FlashCard
              key={current.id}
              flash={current}
              onSwipeLeft={() => advance('left')}
              onSwipeRight={() => advance('right')}
              onDetailOpen={() => setShowDetail(true)}
            />
          )}
        </AnimatePresence>
      </div>


      {/* Detail bottom sheet */}
      <AnimatePresence>
        {showDetail && current && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="absolute inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.15}
              onDragEnd={(_, info) => { if (info.offset.y > 80) setShowDetail(false) }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-5 pb-12 pt-4 max-h-[68vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

              {/* Title + collection */}
              <div className="flex items-start gap-2 justify-between mb-2">
                <h2 className="text-white font-bold text-xl leading-tight">{current.title || 'Untitled'}</h2>
                {current.collection && (
                  <span className="text-xs uppercase tracking-wider text-[#888] border border-border px-2 py-1 rounded-full flex-shrink-0 mt-0.5">
                    {current.collection}
                  </span>
                )}
              </div>

              {/* Description */}
              {current.description && (
                <p className="text-[#888] text-sm leading-relaxed mb-5">{current.description}</p>
              )}

              {/* Price */}
              {(current.priceMin > 0 || current.priceMax > 0) && (
                <div className="bg-surface rounded-xl p-4 mb-4 border border-border">
                  <p className="text-[#888] text-[10px] uppercase tracking-wider mb-3">Pricing</p>
                  <div className="flex justify-around">
                    <div className="text-center">
                      <p className="text-[#555] text-xs mb-1">XS</p>
                      <p className="text-cream font-bold text-xl">${current.priceMin}</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-center">
                      <p className="text-[#555] text-xs mb-1">XL</p>
                      <p className="text-cream font-bold text-xl">${current.priceMax}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Artist + location */}
              <div className="flex items-center gap-3 bg-surface rounded-xl p-4 border border-border mb-5">
                {/* Profile picture */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#222' }}>
                  {current.artistProfileImageUrl ? (
                    <img
                      src={current.artistProfileImageUrl}
                      alt={current.artistHandle}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <a
                    href={current.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white font-semibold hover:text-cream transition-colors"
                  >
                    @{current.artistHandle} ↗
                  </a>
                  <p className="text-[#888] text-xs mt-0.5 truncate">
                    {current.artistLocation}
                    {current.artistDistance != null && ` · ${formatDistance(current.artistDistance)}`}
                  </p>
                </div>
              </div>

              {/* Book this flash */}
              <motion.a
                whileTap={{ scale: 0.97 }}
                href={flashUrl(current.artistHandle, current.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-base mb-3"
                style={{ background: '#d4f542', color: '#0a0a0a' }}
              >
                Book this flash →
              </motion.a>

              {/* Like / Pass */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowDetail(false); setTimeout(() => advance('left'), 80) }}
                  className="flex-1 py-3.5 rounded-xl border border-border text-white font-semibold text-sm"
                >
                  Pass
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowDetail(false); setTimeout(() => advance('right'), 80) }}
                  className="flex-1 py-3.5 rounded-xl bg-cream text-[#0a0a0a] font-bold text-sm"
                >
                  ❤️ Like
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Location modal */}
      <AnimatePresence>
        {showLocationModal && (
          <LocationModal
            currentLocation={userLocation}
            onClose={() => setShowLocationModal(false)}
            onLocationChange={handleLocationChange}
          />
        )}
      </AnimatePresence>

      {/* Artist match sheet */}
      <AnimatePresence>
        {matchedArtist && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMatchedArtist(null)}
              className="absolute inset-0 bg-black/70 z-40"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-6 pb-12 pt-5"
            >
              <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />

              {/* Match label */}
              <div className="flex justify-center mb-5">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                  style={{ background: 'rgba(212,245,66,0.12)', color: '#d4f542' }}
                >
                  Artist match
                </span>
              </div>

              {/* Artist info */}
              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2"
                  style={{ background: '#222', borderColor: 'rgba(212,245,66,0.3)' }}
                >
                  {matchedArtist.profileImageUrl ? (
                    <img
                      src={matchedArtist.profileImageUrl}
                      alt={matchedArtist.handle}
                      className="w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                  ) : null}
                </div>
                <h2 className="text-white font-bold text-xl mb-1">@{matchedArtist.handle}</h2>
                <p className="text-[#666] text-sm">
                  {matchedArtist.location}
                  {matchedArtist.distance != null && ` · ${formatDistance(matchedArtist.distance)}`}
                </p>
                <p className="text-[#888] text-sm mt-3 max-w-[260px] leading-relaxed">
                  You've loved {matchedArtist.likeCount} of their pieces — looks like you found your artist.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <motion.a
                  whileTap={{ scale: 0.97 }}
                  href={matchedArtist.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 rounded-full font-bold text-base text-center"
                  style={{ background: '#d4f542', color: '#0a0a0a' }}
                >
                  Book @{matchedArtist.handle} →
                </motion.a>
                <button
                  onClick={() => setMatchedArtist(null)}
                  className="w-full py-3 text-sm font-medium text-[#666] hover:text-white transition-colors"
                >
                  Keep swiping
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
