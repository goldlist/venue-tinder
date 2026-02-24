import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function groupByArtist(items) {
  return Object.values(
    items.reduce((acc, flash) => {
      const h = flash.artistHandle
      if (!acc[h]) {
        acc[h] = {
          handle: h,
          location: flash.artistLocation,
          bookingUrl: flash.bookingUrl,
          flash: [],
        }
      }
      acc[h].flash.push(flash)
      return acc
    }, {})
  ).sort((a, b) => b.flash.length - a.flash.length)
}

function ArtistList({ groups, countLabel, emptyIcon, emptyTitle, emptyBody, onBook, actionButton }) {
  const [expandedHandle, setExpandedHandle] = useState(null)

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-24 px-8">
        <div className="text-4xl mb-4">{emptyIcon}</div>
        <p className="text-white font-semibold text-lg mb-1">{emptyTitle}</p>
        <p className="text-[#888] text-sm">{emptyBody}</p>
      </div>
    )
  }

  return (
    <div className="px-4 space-y-2 py-3">
      {groups.map((artist, i) => {
        const isExpanded = expandedHandle === artist.handle
        const topFlash = artist.flash[0]

        return (
          <motion.div
            key={artist.handle}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', bounce: 0.2 }}
            className="rounded-2xl overflow-hidden bg-card border border-border"
          >
            <button
              className="w-full flex items-center gap-3 p-3 text-left"
              onClick={() => setExpandedHandle(isExpanded ? null : artist.handle)}
            >
              {/* Thumbnail */}
              <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#0a0a0a' }}>
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
                <p className="text-[#888] text-xs mt-1">{countLabel(artist.flash.length)}</p>
              </div>

              {/* Action + chevron */}
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

            {/* Expanded: horizontal scroll */}
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
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                      {artist.flash.map(flash => (
                        <div key={flash.id} className="flex-shrink-0 w-20 flex flex-col gap-1">
                          <a
                            href={`https://venue.ink/@${artist.handle}/flash/${flash.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-20 h-20 rounded-xl overflow-hidden relative group"
                            style={{ background: '#0a0a0a' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={flash.imageUrl}
                              alt={flash.title}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                            {/* Book overlay on hover/tap */}
                            <div className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 group-active:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.6)' }}>
                              <span className="text-[10px] font-bold text-white">Book →</span>
                            </div>
                            {actionButton && (
                              <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); actionButton.onClick(flash) }}
                                className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                                style={{ background: 'rgba(0,0,0,0.7)' }}
                                title={actionButton.label}
                              >
                                {actionButton.icon}
                              </button>
                            )}
                          </a>
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
  )
}

export default function LikedScreen({ likes, passes, onLikeFlash, onBook, onBack }) {
  const [tab, setTab] = useState('liked')

  const likedGroups = groupByArtist(likes)
  const passedGroups = groupByArtist(passes)

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <div className="px-5 pt-14 pb-0 border-b border-border">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-surface border border-border text-white/60"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>
          <h1 className="text-lg font-bold text-white">Your Flash</h1>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0">
          <button
            onClick={() => setTab('liked')}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors relative"
            style={{ color: tab === 'liked' ? '#fff' : '#555' }}
          >
            ❤️ Liked
            {likes.length > 0 && (
              <span className="text-xs" style={{ color: tab === 'liked' ? '#888' : '#444' }}>
                {likes.length}
              </span>
            )}
            {tab === 'liked' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream rounded-t-full" />
            )}
          </button>
          <button
            onClick={() => setTab('passed')}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors relative"
            style={{ color: tab === 'passed' ? '#fff' : '#555' }}
          >
            ✕ Passed
            {passes.length > 0 && (
              <span className="text-xs" style={{ color: tab === 'passed' ? '#888' : '#444' }}>
                {passes.length}
              </span>
            )}
            {tab === 'passed' && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cream rounded-t-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {tab === 'liked' ? (
            <motion.div
              key="liked"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <ArtistList
                groups={likedGroups}
                countLabel={(n) => `❤️ ${n} piece${n !== 1 ? 's' : ''} liked`}
                emptyIcon="♥"
                emptyTitle="No likes yet"
                emptyBody="Swipe right on flash you love"
                onBook={onBook}
              />
            </motion.div>
          ) : (
            <motion.div
              key="passed"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }}
              className="h-full"
            >
              <ArtistList
                groups={passedGroups}
                countLabel={(n) => `✕ ${n} piece${n !== 1 ? 's' : ''} passed`}
                emptyIcon="○"
                emptyTitle="Nothing passed yet"
                emptyBody="Swipe left to pass on flash"
                onBook={onBook}
                actionButton={{
                  icon: '♥',
                  label: 'Like this',
                  onClick: (flash) => onLikeFlash(flash),
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
