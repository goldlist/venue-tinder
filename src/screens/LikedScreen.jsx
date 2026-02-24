import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LikedScreen({ likes, onBook, onBack }) {
  const [expandedHandle, setExpandedHandle] = useState(null)

  // Group likes by artist, sorted by like count descending
  const artistGroups = Object.values(
    likes.reduce((acc, flash) => {
      const h = flash.artistHandle
      if (!acc[h]) {
        acc[h] = {
          handle: h,
          location: flash.artistLocation,
          bookingUrl: flash.bookingUrl,
          distance: flash.artistDistance,
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
      <div className="flex items-center gap-4 px-5 pt-14 pb-5 border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border text-white/70 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-white">Liked Artists</h1>
          <p className="text-white/40 text-sm">
            {artistGroups.length} artist{artistGroups.length !== 1 ? 's' : ''} · {likes.length} piece{likes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto py-3">
        {artistGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-24 px-8">
            <div className="text-5xl mb-4">♥</div>
            <p className="text-white/50 text-lg font-medium">No likes yet</p>
            <p className="text-white/30 text-sm mt-2">Swipe right on flash you love</p>
          </div>
        ) : (
          <div className="px-4 space-y-2">
            {artistGroups.map((artist, i) => {
              const isExpanded = expandedHandle === artist.handle
              const topFlash = artist.likedFlash[0]

              return (
                <motion.div
                  key={artist.handle}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', bounce: 0.25 }}
                  className="rounded-2xl overflow-hidden bg-card border border-border"
                >
                  {/* Artist row */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
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
                        <div className="w-full h-full flex items-center justify-center text-white/20 text-2xl">♥</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate">@{artist.handle}</p>
                      {artist.location && (
                        <p className="text-white/40 text-xs mt-0.5 truncate">{artist.location}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-gold text-xs">♥</span>
                        <span className="text-white/60 text-xs font-medium">
                          {artist.likedFlash.length} piece{artist.likedFlash.length !== 1 ? 's' : ''} liked
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end flex-shrink-0">
                      <motion.button
                        whileTap={{ scale: 0.93 }}
                        onClick={() => onBook(artist)}
                        className="py-1.5 px-4 rounded-lg bg-gold text-[#0a0a0a] font-bold text-sm"
                      >
                        Book
                      </motion.button>
                      <button
                        onClick={() => setExpandedHandle(isExpanded ? null : artist.handle)}
                        className="text-white/30 text-xs flex items-center gap-1"
                      >
                        {isExpanded ? 'Hide' : 'Show all'}
                        <svg
                          width="12" height="12" viewBox="0 0 12 12" fill="none"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                        >
                          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Expandable flash grid */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 border-t border-border/50 pt-3">
                          <div className="grid grid-cols-3 gap-2">
                            {artist.likedFlash.map(flash => (
                              <div
                                key={flash.id}
                                className="aspect-square rounded-xl overflow-hidden"
                                style={{ background: '#0a0a0a' }}
                              >
                                <img
                                  src={flash.imageUrl}
                                  alt={flash.title}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                            ))}
                          </div>
                          {/* Flash titles */}
                          <div className="mt-2 space-y-1">
                            {artist.likedFlash.map(flash => (
                              <div key={flash.id} className="flex items-center justify-between gap-2">
                                <p className="text-white/70 text-xs truncate">{flash.title || 'Untitled'}</p>
                                {flash.priceMin > 0 && (
                                  <p className="text-white/40 text-xs flex-shrink-0">
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
