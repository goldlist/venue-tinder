import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ArtistCard from '../components/ArtistCard'
import artists from '../data/artists.json'

export default function SwipeScreen({ onLike, likedCount, onViewLiked }) {
  const [deck, setDeck] = useState(() =>
    artists.map((artist, i) => ({ ...artist, deckIndex: i }))
  )
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [exiting, setExiting] = useState(null) // { direction: 'left' | 'right', artist }

  const currentArtist = deck[0] ?? null

  const advance = useCallback((direction) => {
    if (!currentArtist) return
    setExiting({ direction, artist: currentArtist })
    if (direction === 'right') onLike(currentArtist)
    setTimeout(() => {
      setDeck(prev => prev.slice(1))
      setCurrentImageIndex(0)
      setExiting(null)
    }, 350)
  }, [currentArtist, onLike])

  const handleNextImage = () => {
    if (!currentArtist) return
    const images = currentArtist.flashImages?.filter(Boolean) ?? []
    if (currentImageIndex < images.length - 1) {
      setCurrentImageIndex(i => i + 1)
    } else {
      advance('right')
    }
  }

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(i => i - 1)
    }
  }

  if (!currentArtist && !exiting) {
    return (
      <div className="flex flex-col min-h-dvh bg-bg items-center justify-center px-8 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}
        >
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-2xl font-bold text-white mb-3">You've seen everyone nearby</h2>
          <p className="text-white/50 mb-8">Check back later for new artists</p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setDeck(artists.map((artist, i) => ({ ...artist, deckIndex: i })))
              setCurrentImageIndex(0)
            }}
            className="py-3 px-8 rounded-xl bg-gold text-[#0a0a0a] font-bold"
          >
            Start over
          </motion.button>
          {likedCount > 0 && (
            <button
              onClick={onViewLiked}
              className="block mt-4 text-gold text-sm font-medium mx-auto"
            >
              View {likedCount} liked artist{likedCount !== 1 ? 's' : ''}
            </button>
          )}
        </motion.div>
      </div>
    )
  }

  const flashImages = currentArtist?.flashImages?.filter(Boolean) ?? []
  const totalImages = flashImages.length

  return (
    <div className="flex flex-col min-h-dvh bg-bg select-none">
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-4 max-w-[430px] mx-auto">
        <div className="text-xl font-black text-white tracking-tight">Discover</div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onViewLiked}
          className="relative flex items-center gap-2 py-2 px-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white text-sm font-medium"
        >
          <span>Liked</span>
          {likedCount > 0 && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-gold text-[#0a0a0a] text-xs font-bold">
              {likedCount}
            </span>
          )}
        </motion.button>
      </div>

      {/* Card area */}
      <div className="flex-1 flex items-center justify-center relative px-4 pt-24 pb-32">
        {/* Shadow cards behind */}
        {deck.slice(1, 3).map((artist, i) => (
          <div
            key={artist.handle}
            className="absolute inset-x-4 rounded-3xl overflow-hidden"
            style={{
              top: `calc(5rem + ${(i + 1) * 8}px)`,
              bottom: `calc(8rem + ${(i + 1) * 8}px)`,
              transform: `scale(${1 - (i + 1) * 0.03})`,
              transformOrigin: 'bottom center',
              opacity: 1 - (i + 1) * 0.25,
              zIndex: 2 - i,
              background: '#141414',
            }}
          />
        ))}

        {/* Active card */}
        <AnimatePresence>
          {currentArtist && (
            <ArtistCard
              key={`${currentArtist.handle}-${currentArtist.deckIndex}`}
              artist={currentArtist}
              imageIndex={currentImageIndex}
              totalImages={totalImages}
              exitDirection={exiting?.direction}
              onSwipeLeft={() => advance('left')}
              onSwipeRight={() => advance('right')}
              onTapLeft={handlePrevImage}
              onTapRight={handleNextImage}
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
            className="flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-2xl"
          >
            ✕
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={() => advance('right')}
            className="flex items-center justify-center w-20 h-20 rounded-full bg-gold/20 backdrop-blur-sm border border-gold/40 text-3xl"
          >
            ♥
          </motion.button>
        </div>
      </div>
    </div>
  )
}
