import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FlashCard from '../components/FlashCard'
import LocationModal from '../components/LocationModal'
import VenueLogo from '../components/VenueLogo'
import { buildFeed, formatDistance } from '../utils/geo'
import artistsData from '../data/artists.json'

function preloadImages(feed, startIdx, count) {
  for (let i = startIdx; i < Math.min(startIdx + count, feed.length); i++) {
    if (feed[i]?.imageUrl) {
      const img = new Image()
      img.src = feed[i].imageUrl
    }
  }
}

export default function SwipeScreen({ userLocation, onLocationChange, onLikeFlash, likedCount, onViewLiked }) {
  const [feed, setFeed] = useState(() =>
    buildFeed(artistsData, userLocation?.lat, userLocation?.lng)
  )
  const [currentIdx, setCurrentIdx] = useState(0)
  const [showDetail, setShowDetail] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const likeCountsRef = useRef({})

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

    if (direction === 'right') {
      const handle = current.artistHandle
      likeCountsRef.current[handle] = (likeCountsRef.current[handle] || 0) + 1
      onLikeFlash(current)

      // Inject up to 2 more unseen flash from this artist into next ~10 positions
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
        const insertAt = Math.min(currentIdx + 1 + 3, currentIdx + 1 + upcoming.length)
        return [
          ...prev.slice(0, currentIdx + 1 + 3),
          ...toInject,
          ...prev.slice(currentIdx + 1 + 3),
        ]
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
    <div className="flex flex-col min-h-dvh bg-bg select-none">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-12 pb-3 max-w-[430px] mx-auto pointer-events-none">
        <div className="pointer-events-none"><VenueLogo size="sm" /></div>

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
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onViewLiked}
          className="pointer-events-auto flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/8 border border-white/10 text-white text-xs font-medium"
        >
          <span>❤️</span>
          <span>{likedCount}</span>
        </motion.button>
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
    </div>
  )
}
