import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LikedScreen({ likes, onBook, onBack }) {
  const [expandedHandle, setExpandedHandle] = useState(null)

  // Group by artist, sort by like count desc
  const artistGroups = Object.values(
    likes.reduce((acc, flash) => {
      const h = flash.artistHandle
      if (!acc[h]) {
        acc[h] = {
          handle: h,
          location: flash.artistLocation,
          bookingUrl: flash.bookingUrl,
          likedFlash: [],
        }
      }
      acc[h].likedFlash.push(flash)
      return acc
    }, {})
  ).sort((a, b) => b.likedFlash.length - a.likedFlash.length)

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-border text-white/60"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <h1 className="text-lg font-bold text-white">Liked</h1>
        {artistGroups.length > 0 && (
          <span className="text-[#888] text-sm ml-1">
            {artistGroups.length} artist{artistGroups.length !== 1 ? 's' : ''} · {likes.length} piece{likes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-3">
        {artistGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24 px-8">
            <div className="text-4xl mb-4">♥</div>
            <p className="text-white font-semibold text-lg mb-1">No likes yet</p>
            <p className="text-[#888] text-sm">Swipe right on flash you love</p>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {artistGroups.map((artist, i) => {
              const isExpanded = expandedHandle === artist.handle
              const topFlash = artist.likedFlash[0]

              return (
                <motion.div
                  key={artist.handle}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', bounce: 0.2 }}
                  className="rounded-2xl overflow-hidden bg-card border border-border"
                >
                  {/* Row — tap to expand */}
                  <button
                    className="w-full flex items-center gap-3 p-3 text-left"
                    onClick={() => setExpandedHandle(isExpanded ? null : artist.handle)}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0"
                      style={{ background: '#0a0a0a' }}
                    >
                      {topFlash?.imageUrl ? (
                        <img
                          src={topFlash.imageUrl}
                          alt={artist.handle}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/10 text-xl">✦</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">@{artist.handle}</p>
                      {artist.location && (
                        <p className="text-[#888] text-xs mt-0.5 truncate">{artist.location}</p>
                      )}
                      <p className="text-[#888] text-xs mt-1">
                        ❤️ {artist.likedFlash.length} piece{artist.likedFlash.length !== 1 ? 's' : ''} liked
                      </p>
                    </div>

                    {/* Book + chevron */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={(e) => { e.stopPropagation(); onBook(artist) }}
                        className="py-1.5 px-4 rounded-full bg-cream text-[#0a0a0a] font-bold text-xs"
                      >
                        Book →
                      </motion.button>
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: '#555' }}
                      >
                        <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  {/* Expanded: horizontal scroll of liked flash */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-border/60 px-3 py-3">
                          {/* Horizontal scroll row */}
                          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                            {artist.likedFlash.map(flash => (
                              <div
                                key={flash.id}
                                className="flex-shrink-0 w-20 flex flex-col gap-1"
                              >
                                <div
                                  className="w-20 h-20 rounded-xl overflow-hidden"
                                  style={{ background: '#0a0a0a' }}
                                >
                                  <img
                                    src={flash.imageUrl}
                                    alt={flash.title}
                                    className="w-full h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <p className="text-[#888] text-[10px] truncate leading-tight">{flash.title || '—'}</p>
                                {flash.priceMin > 0 && (
                                  <p className="text-cream text-[10px]">
                                    ${flash.priceMin}{flash.priceMax !== flash.priceMin ? `–$${flash.priceMax}` : ''}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
