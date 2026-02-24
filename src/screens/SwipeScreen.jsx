import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import FlashCard from '../components/FlashCard'
import artistsData from '../data/artists.json'

// Seeded shuffle using Fisher-Yates with a numeric seed
function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = seed
  const rand = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Flatten all flash items with artist context
function buildFlatFeed(artists) {
  const all = artists.flatMap(artist =>
    artist.flash.map(f => ({
      ...f,
      artistHandle: artist.handle,
      artistLocation: artist.location,
      artistDistance: artist.distance,
      bookingUrl: artist.bookingUrl,
      priceRange: artist.priceRange,
    }))
  )
  // Shuffle with a time-based seed so each session is different
  return seededShuffle(all, Date.now() & 0xffffff)
}

// Preload the next N images
function preloadImages(feed, startIdx, count) {
  for (let i = startIdx; i < Math.min(startIdx + count, feed.length); i++) {
    if (feed[i]?.imageUrl) {
      const img = new Image()
      img.src = feed[i].imageUrl
    }
  }
}

export default function SwipeScreen({ onLikeFlash, likedCount, onViewLiked }) {
  const [feed, setFeed] = useState(() => buildFlatFeed(artistsData))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [exiting, setExiting] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const likeCountsRef = useRef({}) // handle → like count

  const current = feed[currentIdx] ?? null
  const next1 = feed[currentIdx + 1] ?? null
  const next2 = feed[currentIdx + 2] ?? null

  // Preload upcoming images
  useEffect(() => {
    preloadImages(feed, currentIdx + 1, 4)
  }, [currentIdx, feed])

  const advance = useCallback((direction) => {
    if (!current) return
    setShowDetail(false)
    setExiting({ direction, item: current })

    if (direction === 'right') {
      const handle = current.artistHandle
      likeCountsRef.current[handle] = (likeCountsRef.current[handle] || 0) + 1
      onLikeFlash(current)

      // Smart weighting: inject more of this artist's unseen flash near front
      setFeed(prev => {
        const upcoming = prev.slice(currentIdx + 1)
        const seenIds = new Set(prev.slice(0, currentIdx + 1).map(f => f.id))
        // Find artist's flash not yet in upcoming
        const artistObj = artistsData.find(a => a.handle === handle)
        const upcomingIds = new Set(upcoming.map(f => f.id))
        const toInject = (artistObj?.flash ?? [])
          .filter(f => !seenIds.has(f.id) && !upcomingIds.has(f.id))
          .slice(0, 2)
          .map(f => ({
            ...f,
            artistHandle: artistObj.handle,
            artistLocation: artistObj.location,
            artistDistance: artistObj.distance,
            bookingUrl: artistObj.bookingUrl,
            priceRange: artistObj.priceRange,
          }))

        if (toInject.length > 0) {
          // Insert after the next card (position 2 in upcoming = index 3 of remaining)
          const insertAt = Math.min(2, upcoming.length)
          const newUpcoming = [
            ...upcoming.slice(0, insertAt),
            ...toInject,
            ...upcoming.slice(insertAt),
          ]
          return [...prev.slice(0, currentIdx + 1), ...newUpcoming]
        }
        return prev
      })
    }

    setTimeout(() => {
      setCurrentIdx(i => i + 1)
      setExiting(null)
    }, 300)
  }, [current, currentIdx, onLikeFlash])

  const handleReset = () => {
    setFeed(buildFlatFeed(artistsData))
    setCurrentIdx(0)
    setExiting(null)
    setShowDetail(false)
    likeCountsRef.current = {}
  }

  const remaining = feed.length - currentIdx

  // Empty state
  if (!current && !exiting) {
    return (
      <div className="flex flex-col min-h-dvh bg-bg items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}
        >
          <div className="text-5xl mb-6">🖤</div>
          <h2 className="text-2xl font-bold text-white mb-2">You've seen it all</h2>
          <p className="text-white/40 mb-8 text-sm">You've gone through all available flash</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReset}
            className="py-3 px-8 rounded-xl bg-gold text-[#0a0a0a] font-bold"
          >
            Start over
          </motion.button>
          {likedCount > 0 && (
            <button onClick={onViewLiked} className="block mt-4 text-gold text-sm font-medium mx-auto">
              View {likedCount} liked
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-5 pt-12 pb-4 max-w-[430px] mx-auto">
        <div className="text-xl font-black text-white tracking-tight">Discover</div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onViewLiked}
          className="relative flex items-center gap-2 py-2 px-4 rounded-xl bg-white/8 backdrop-blur-sm border border-white/10 text-white text-sm font-medium"
        >
          <span>Liked</span>
          {likedCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold text-[#0a0a0a] text-xs font-bold">
              {likedCount > 99 ? '99+' : likedCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Card stack area */}
      <div className="absolute inset-0 flex flex-col pt-24 pb-32">
        {/* Shadow cards (cards 2 and 3 in queue) */}
        {[next2, next1].filter(Boolean).map((item, i) => (
          <div
            key={item.id}
            className="absolute inset-x-3 top-24 bottom-32 rounded-3xl overflow-hidden"
            style={{
              transform: `scale(${0.93 + i * 0.03}) translateY(${(1 - i) * -8}px)`,
              transformOrigin: 'bottom center',
              background: '#141414',
              opacity: 0.6 + i * 0.2,
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

      {/* Bottom action bar */}
      <div className="absolute bottom-0 left-0 right-0 max-w-[430px] mx-auto pb-10 px-8 z-20">
        <div className="flex items-center justify-center gap-10">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => advance('left')}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-white/8 backdrop-blur-sm border border-white/12 text-2xl"
          >
            ✕
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => advance('right')}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-gold/15 backdrop-blur-sm border border-gold/35 text-3xl"
          >
            ♥
          </motion.button>
        </div>
      </div>

      {/* Detail Bottom Sheet */}
      <AnimatePresence>
        {showDetail && current && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetail(false)}
              className="absolute inset-0 bg-black/50 z-40"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80) setShowDetail(false)
              }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-white/10 px-6 pb-12 pt-5 max-h-[70vh] overflow-y-auto"
            >
              {/* Drag handle */}
              <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-6" />

              {/* Flash image thumbnail */}
              <div className="w-full aspect-square rounded-2xl overflow-hidden mb-5" style={{ background: '#0a0a0a' }}>
                <img
                  src={current.imageUrl}
                  alt={current.title}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Title + collection */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="text-white font-bold text-xl leading-tight">{current.title || 'Untitled'}</h2>
                {current.collection && (
                  <span className="text-gold text-xs font-medium px-3 py-1 rounded-full bg-gold/10 border border-gold/20 flex-shrink-0 mt-0.5">
                    {current.collection}
                  </span>
                )}
              </div>

              {/* Description */}
              {current.description && (
                <p className="text-white/60 text-sm leading-relaxed mb-5">{current.description}</p>
              )}

              {/* Price breakdown */}
              {(current.priceMin > 0 || current.priceMax > 0) && (
                <div className="bg-surface rounded-2xl p-4 mb-5 border border-border">
                  <p className="text-white/40 text-xs uppercase tracking-wider mb-3 font-medium">Pricing</p>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-white/50 text-xs mb-0.5">XS size</p>
                      <p className="text-white font-bold text-lg">${current.priceMin}</p>
                    </div>
                    <div className="w-px bg-border" />
                    <div className="text-right">
                      <p className="text-white/50 text-xs mb-0.5">XL size</p>
                      <p className="text-white font-bold text-lg">${current.priceMax}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Artist link */}
              <div className="flex items-center justify-between bg-surface rounded-2xl p-4 border border-border mb-5">
                <div>
                  <p className="text-white/40 text-xs mb-0.5">Artist</p>
                  <p className="text-white font-semibold">@{current.artistHandle}</p>
                  {current.artistLocation && (
                    <p className="text-white/40 text-xs mt-0.5">{current.artistLocation}</p>
                  )}
                </div>
                <a
                  href={current.bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-4 rounded-xl bg-gold text-[#0a0a0a] font-bold text-sm"
                >
                  View ↗
                </a>
              </div>

              {/* Like / Pass from detail */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowDetail(false); setTimeout(() => advance('left'), 100) }}
                  className="flex-1 py-3 rounded-xl bg-white/8 border border-white/12 text-white font-semibold"
                >
                  Pass
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setShowDetail(false); setTimeout(() => advance('right'), 100) }}
                  className="flex-1 py-3 rounded-xl bg-gold text-[#0a0a0a] font-bold"
                >
                  ♥ Like
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
