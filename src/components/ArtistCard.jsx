import { useRef } from 'react'
import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'

const SWIPE_THRESHOLD = 80

export default function ArtistCard({
  artist,
  imageIndex,
  totalImages,
  exitDirection,
  onSwipeLeft,
  onSwipeRight,
  onTapLeft,
  onTapRight,
}) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const passOpacity = useTransform(x, [-100, -20], [1, 0])
  const controls = useAnimationControls()
  const dragStartX = useRef(0)

  const flashImages = artist.flashImages?.filter(Boolean) ?? []
  const currentImage = flashImages[imageIndex] || artist.profileImage

  const handleDragStart = (_, info) => {
    dragStartX.current = info.point.x
  }

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x
    if (offset > SWIPE_THRESHOLD) {
      controls.start({ x: 600, opacity: 0, transition: { duration: 0.3 } }).then(onSwipeRight)
    } else if (offset < -SWIPE_THRESHOLD) {
      controls.start({ x: -600, opacity: 0, transition: { duration: 0.3 } }).then(onSwipeLeft)
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } })
    }
  }

  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const tapX = e.clientX - rect.left
    const halfWidth = rect.width / 2
    if (tapX < halfWidth) {
      onTapLeft()
    } else {
      onTapRight()
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate }}
      onClick={handleTap}
      className="absolute inset-x-4 top-0 bottom-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing z-10"
      initial={{ scale: 1 }}
    >
      {/* Image */}
      <div className="absolute inset-0 bg-surface">
        {currentImage ? (
          <img
            src={currentImage}
            alt={artist.handle}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-6xl">♥</span>
          </div>
        )}
      </div>

      {/* Image progress dots */}
      {totalImages > 1 && (
        <div className="absolute top-4 left-4 right-4 flex gap-1 z-10">
          {Array.from({ length: totalImages }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full transition-colors duration-200"
              style={{ background: i === imageIndex ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' }}
            />
          ))}
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 pointer-events-none" />

      {/* Like overlay */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute inset-0 bg-green-500/20 pointer-events-none"
      />
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-16 right-6 pointer-events-none"
      >
        <div className="px-4 py-2 rounded-xl border-4 border-green-400 text-green-400 text-3xl font-black tracking-widest rotate-[-15deg]">
          LIKE
        </div>
      </motion.div>

      {/* Pass overlay */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute inset-0 bg-red-500/20 pointer-events-none"
      />
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-16 left-6 pointer-events-none"
      >
        <div className="px-4 py-2 rounded-xl border-4 border-red-400 text-red-400 text-3xl font-black tracking-widest rotate-[15deg]">
          PASS
        </div>
      </motion.div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-10 z-10">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-white font-bold text-xl leading-tight">@{artist.handle}</h2>
            {artist.location && (
              <p className="text-white/60 text-sm mt-0.5">{artist.location}</p>
            )}
          </div>
          <div className="text-right">
            {typeof artist.distance === 'number' && (
              <p className="text-white/70 text-sm font-medium">{artist.distance.toFixed(1)} mi</p>
            )}
          </div>
        </div>

        {/* Style tags */}
        {artist.styles?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {artist.styles.slice(0, 4).map(style => (
              <span
                key={style}
                className="text-xs px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 font-medium"
              >
                {style}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
