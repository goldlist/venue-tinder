import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'

const SWIPE_THRESHOLD = 80

export default function FlashCard({ flash, onSwipeLeft, onSwipeRight, onDetailOpen }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const likeOpacity = useTransform(x, [30, 110], [0, 1])
  const passOpacity = useTransform(x, [-110, -30], [1, 0])
  const controls = useAnimationControls()
  const handleDragStart = () => {}

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x
    if (offset > SWIPE_THRESHOLD) {
      controls.start({ x: 700, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }).then(onSwipeRight)
    } else if (offset < -SWIPE_THRESHOLD) {
      controls.start({ x: -700, opacity: 0, transition: { duration: 0.28, ease: 'easeIn' } }).then(onSwipeLeft)
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } })
    }
  }

  const handleChevronClick = (e) => {
    e.stopPropagation()
    onDetailOpen()
  }

  const priceLabel = flash.priceMin > 0
    ? flash.priceMin === flash.priceMax
      ? `$${flash.priceMin}`
      : `$${flash.priceMin}–$${flash.priceMax}`
    : null

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate }}
      className="absolute inset-x-3 top-0 bottom-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing z-10 select-none"
      initial={{ scale: 1, opacity: 1 }}
    >
      {/* Image — object-contain so nothing is cropped */}
      <div className="absolute inset-0" style={{ background: '#0a0a0a' }}>
        {flash.imageUrl ? (
          <img
            src={flash.imageUrl}
            alt={flash.title}
            className="w-full h-full object-contain"
            draggable={false}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/10 text-7xl">♥</div>
        )}
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 35%, transparent 65%)' }}
      />

      {/* Like stamp */}
      <motion.div
        style={{ opacity: likeOpacity, background: 'rgba(34,197,94,0.12)' }}
        className="absolute inset-0 pointer-events-none"
      />
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-14 right-5 pointer-events-none"
      >
        <div className="px-4 py-1.5 rounded-xl border-[3px] border-green-400 text-green-400 text-2xl font-black tracking-widest rotate-[-12deg]">
          LIKE
        </div>
      </motion.div>

      {/* Pass stamp */}
      <motion.div
        style={{ opacity: passOpacity, background: 'rgba(239,68,68,0.12)' }}
        className="absolute inset-0 pointer-events-none"
      />
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-14 left-5 pointer-events-none"
      >
        <div className="px-4 py-1.5 rounded-xl border-[3px] border-red-400 text-red-400 text-2xl font-black tracking-widest rotate-[12deg]">
          NOPE
        </div>
      </motion.div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-12 z-10">
        {/* Artist + distance */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-white font-bold text-xl tracking-tight">@{flash.artistHandle}</span>
          {flash.artistDistance != null && (
            <span className="text-white/50 text-sm">{flash.artistDistance} mi</span>
          )}
        </div>

        {/* Flash title + collection */}
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {flash.title && (
            <span className="text-white/90 text-sm font-medium">{flash.title}</span>
          )}
          {flash.collection && (
            <>
              <span className="text-white/30 text-sm">·</span>
              <span className="text-gold text-xs font-medium">{flash.collection}</span>
            </>
          )}
        </div>

        {/* Price + location */}
        <div className="flex items-center justify-between">
          {priceLabel && (
            <span className="text-white/80 text-sm font-semibold">{priceLabel}</span>
          )}
          {flash.artistLocation && (
            <span className="text-white/40 text-xs ml-auto">{flash.artistLocation}</span>
          )}
        </div>

        {/* Chevron to open detail sheet */}
        <button
          onClick={handleChevronClick}
          className="flex items-center justify-center gap-1 mt-3 mx-auto text-white/35 hover:text-white/60 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 12.5L10 7.5L15 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs">Details</span>
        </button>
      </div>
    </motion.div>
  )
}
