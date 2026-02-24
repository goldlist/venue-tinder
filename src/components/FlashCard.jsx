import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'
import { formatDistance } from '../utils/geo'

const SWIPE_THRESHOLD = 80

export default function FlashCard({ flash, onSwipeLeft, onSwipeRight, onDetailOpen }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-14, 14])
  const likeOpacity = useTransform(x, [30, 110], [0, 1])
  const passOpacity = useTransform(x, [-110, -30], [1, 0])
  const controls = useAnimationControls()

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x
    if (offset > SWIPE_THRESHOLD) {
      controls.start({ x: 700, opacity: 0, transition: { duration: 0.26, ease: 'easeIn' } }).then(onSwipeRight)
    } else if (offset < -SWIPE_THRESHOLD) {
      controls.start({ x: -700, opacity: 0, transition: { duration: 0.26, ease: 'easeIn' } }).then(onSwipeLeft)
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 350, damping: 26 } })
    }
  }

  const distLabel = formatDistance(flash.artistDistance)
  const priceLabel = flash.priceMin > 0
    ? flash.priceMin === flash.priceMax ? `$${flash.priceMin}` : `$${flash.priceMin} – $${flash.priceMax}`
    : null

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate }}
      className="absolute inset-x-3 top-0 bottom-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing z-10 select-none"
    >
      {/* Image — object-contain, dark bg */}
      <div className="absolute inset-0" style={{ background: '#111111' }}>
        {flash.imageUrl ? (
          <img
            src={flash.imageUrl}
            alt={flash.title || flash.artistHandle}
            className="w-full h-full object-contain"
            draggable={false}
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <span className="text-white/10 text-5xl">✦</span>
            <span className="text-white/20 text-sm">@{flash.artistHandle}</span>
          </div>
        )}
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.6) 30%, transparent 60%)' }}
      />

      {/* LIKE stamp */}
      <motion.div
        style={{ opacity: likeOpacity, background: 'rgba(74,222,128,0.1)' }}
        className="absolute inset-0 pointer-events-none"
      />
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-14 right-5 pointer-events-none">
        <div className="px-4 py-1.5 rounded-xl border-[3px] border-like-green text-like-green text-2xl font-black tracking-widest rotate-[-12deg]">
          LIKE
        </div>
      </motion.div>

      {/* NOPE stamp */}
      <motion.div
        style={{ opacity: passOpacity, background: 'rgba(248,113,113,0.1)' }}
        className="absolute inset-0 pointer-events-none"
      />
      <motion.div style={{ opacity: passOpacity }} className="absolute top-14 left-5 pointer-events-none">
        <div className="px-4 py-1.5 rounded-xl border-[3px] border-pass-red text-pass-red text-2xl font-black tracking-widest rotate-[12deg]">
          NOPE
        </div>
      </motion.div>

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-16 z-10">
        {/* Handle + distance */}
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-white font-bold text-xl tracking-tight">@{flash.artistHandle}</span>
          {distLabel && <span className="text-[#888] text-xs">{distLabel}</span>}
        </div>

        {/* Flash title · Collection */}
        <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mb-2">
          {flash.title && <span className="text-[#888] text-sm">{flash.title}</span>}
          {flash.title && flash.collection && <span className="text-[#555] text-sm">·</span>}
          {flash.collection && <span className="text-[#888] text-sm">{flash.collection}</span>}
        </div>

        {/* Price */}
        {priceLabel && (
          <p className="text-cream text-sm font-semibold mb-3">{priceLabel}</p>
        )}

        {/* Detail chevron */}
        <button
          onClick={(e) => { e.stopPropagation(); onDetailOpen() }}
          className="flex items-center justify-center gap-1 mx-auto text-white/25 hover:text-white/50 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4.5 11L9 6.5L13.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-xs uppercase tracking-wider">More</span>
        </button>
      </div>
    </motion.div>
  )
}
