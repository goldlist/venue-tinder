import { motion } from 'framer-motion'

export default function LikedScreen({ artists, onBook, onBack }) {
  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 pt-14 pb-5 border-b border-border">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border text-white/70"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <div>
          <h1 className="text-xl font-bold text-white">Liked Artists</h1>
          <p className="text-white/40 text-sm">{artists.length} artist{artists.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {artists.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="text-5xl mb-4">♥</div>
            <p className="text-white/50 text-lg">No liked artists yet</p>
            <p className="text-white/30 text-sm mt-2">Swipe right to save artists you love</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {artists.map((artist, i) => (
              <motion.div
                key={artist.handle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', bounce: 0.3 }}
                className="flex flex-col rounded-2xl overflow-hidden bg-card border border-border"
              >
                {/* Image */}
                <div className="relative aspect-square bg-surface">
                  {artist.flashImages?.[0] ? (
                    <img
                      src={artist.flashImages[0]}
                      alt={artist.handle}
                      className="w-full h-full object-cover"
                    />
                  ) : artist.profileImage ? (
                    <img
                      src={artist.profileImage}
                      alt={artist.handle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/20 text-4xl">
                      ♥
                    </div>
                  )}
                  {/* Heart badge */}
                  <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-sm">
                    ♥
                  </div>
                </div>

                {/* Info */}
                <div className="p-3 flex flex-col gap-2">
                  <p className="text-white font-semibold text-sm truncate">@{artist.handle}</p>

                  {artist.styles?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {artist.styles.slice(0, 2).map(style => (
                        <span
                          key={style}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60"
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onBook(artist)}
                    className="w-full py-2 rounded-lg bg-gold text-[#0a0a0a] font-bold text-sm mt-1"
                  >
                    Book
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
