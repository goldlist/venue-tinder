import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'
import { formatDistance } from '../utils/geo'

const SWIPE_THRESHOLD = 80

function ZoomableImage({ src, alt, onZoomChange }) {
  const containerRef = useRef(null)
  const scaleRef = useRef(1)
  const txRef = useRef(0)
  const tyRef = useRef(0)
  const lastPinchDistRef = useRef(null)
  const lastPanRef = useRef(null)
  const [imgStyle, setImgStyle] = useState({ scale: 1, x: 0, y: 0 })
  const [imgError, setImgError] = useState(false)

  const isZoomed = () => scaleRef.current > 1.01

  const commit = () =>
    setImgStyle({ scale: scaleRef.current, x: txRef.current, y: tyRef.current })

  const reset = useCallback(() => {
    scaleRef.current = 1
    txRef.current = 0
    tyRef.current = 0
    setImgStyle({ scale: 1, x: 0, y: 0 })
    onZoomChange?.(false)
  }, [onZoomChange])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)

    const onStart = (e) => {
      if (e.touches.length === 2) {
        lastPinchDistRef.current = dist(e.touches[0], e.touches[1])
      } else if (e.touches.length === 1 && isZoomed()) {
        lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const onMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault() // needs non-passive listener
        const d = dist(e.touches[0], e.touches[1])
        if (lastPinchDistRef.current != null) {
          const next = Math.max(1, Math.min(5, scaleRef.current * (d / lastPinchDistRef.current)))
          scaleRef.current = next
          if (next <= 1) { txRef.current = 0; tyRef.current = 0; onZoomChange?.(false) }
          else onZoomChange?.(true)
          commit()
        }
        lastPinchDistRef.current = d
      } else if (e.touches.length === 1 && isZoomed() && lastPanRef.current) {
        const dx = e.touches[0].clientX - lastPanRef.current.x
        const dy = e.touches[0].clientY - lastPanRef.current.y
        txRef.current += dx
        tyRef.current += dy
        lastPanRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        commit()
      }
    }

    const onEnd = (e) => {
      if (e.touches.length < 2) lastPinchDistRef.current = null
      if (e.touches.length === 0) {
        lastPanRef.current = null
        if (!isZoomed()) reset()
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
    }
  }, [reset, onZoomChange])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ background: '#ffffff', overflow: 'hidden' }}
    >
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          draggable={false}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: `scale(${imgStyle.scale}) translate(${imgStyle.x / imgStyle.scale}px, ${imgStyle.y / imgStyle.scale}px)`,
            transformOrigin: 'center',
            transition: imgStyle.scale === 1 ? 'transform 0.25s ease' : 'none',
            willChange: 'transform',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: '#141414' }}>
          <span className="text-white/10 text-5xl">✦</span>
          <span className="text-white/20 text-sm">@{alt}</span>
        </div>
      )}
    </div>
  )
}

const LIKE_COLOR = '#d4f542'
const NOPE_COLOR = '#ff3356'

export default function FlashCard({ flash, onSwipeLeft, onSwipeRight, onDetailOpen }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-18, 18])
  const likeOpacity = useTransform(x, [20, 90], [0, 1])
  const passOpacity = useTransform(x, [-90, -20], [1, 0])
  const likeStampScale = useTransform(x, [20, 110], [0.6, 1])
  const passStampScale = useTransform(x, [-110, -20], [1, 0.6])
  const controls = useAnimationControls()
  const [zoomed, setZoomed] = useState(false)

  const handleDragEnd = (_, info) => {
    const offset = info.offset.x
    const vel = info.velocity.x
    if (offset > SWIPE_THRESHOLD || vel > 600) {
      controls.start({ x: 900, y: -60, rotate: 22, opacity: 0, transition: { duration: 0.32, ease: [0.2, 0, 0.6, 1] } }).then(onSwipeRight)
    } else if (offset < -SWIPE_THRESHOLD || vel < -600) {
      controls.start({ x: -900, y: -60, rotate: -22, opacity: 0, transition: { duration: 0.32, ease: [0.2, 0, 0.6, 1] } }).then(onSwipeLeft)
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } })
    }
  }

  const distLabel = formatDistance(flash.artistDistance)
  const priceLabel = flash.priceMin > 0
    ? flash.priceMin === flash.priceMax ? `$${flash.priceMin}` : `$${flash.priceMin} – $${flash.priceMax}`
    : null

  return (
    <motion.div
      drag={zoomed ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate, touchAction: 'none' }}
      className="absolute inset-x-3 top-24 bottom-0 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing z-10 select-none"
    >
      <ZoomableImage
        src={flash.imageUrl}
        alt={flash.title || flash.artistHandle}
        onZoomChange={setZoomed}
      />

      {/* Hide overlays while zoomed so user sees the full image */}
      {!zoomed && (
        <>
          {/* Bottom gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #0a0a0a 0%, rgba(10,10,10,0.6) 30%, transparent 60%)' }}
          />

          {/* LIKE glow overlay — radial from top-right */}
          <motion.div
            style={{
              opacity: likeOpacity,
              background: `radial-gradient(ellipse at 85% 20%, rgba(212,245,66,0.22) 0%, transparent 60%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />
          {/* LIKE stamp */}
          <motion.div
            style={{ opacity: likeOpacity, scale: likeStampScale }}
            className="absolute top-16 right-5 pointer-events-none origin-top-right"
          >
            <div style={{
              padding: '7px 18px',
              border: `3.5px solid ${LIKE_COLOR}`,
              borderRadius: '8px',
              color: LIKE_COLOR,
              fontSize: '30px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              transform: 'rotate(-14deg)',
              textShadow: `0 0 24px rgba(212,245,66,0.7)`,
              boxShadow: `0 0 24px rgba(212,245,66,0.25), inset 0 0 16px rgba(212,245,66,0.08)`,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}>
              LIKE
            </div>
          </motion.div>

          {/* NOPE glow overlay — radial from top-left */}
          <motion.div
            style={{
              opacity: passOpacity,
              background: `radial-gradient(ellipse at 15% 20%, rgba(255,51,86,0.22) 0%, transparent 60%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />
          {/* NOPE stamp */}
          <motion.div
            style={{ opacity: passOpacity, scale: passStampScale }}
            className="absolute top-16 left-5 pointer-events-none origin-top-left"
          >
            <div style={{
              padding: '7px 18px',
              border: `3.5px solid ${NOPE_COLOR}`,
              borderRadius: '8px',
              color: NOPE_COLOR,
              fontSize: '30px',
              fontWeight: 900,
              letterSpacing: '0.1em',
              transform: 'rotate(14deg)',
              textShadow: `0 0 24px rgba(255,51,86,0.7)`,
              boxShadow: `0 0 24px rgba(255,51,86,0.25), inset 0 0 16px rgba(255,51,86,0.08)`,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}>
              NOPE
            </div>
          </motion.div>

          {/* Bottom info + action buttons */}
          <div className="absolute bottom-0 left-0 right-0 z-10">
            <div className="flex items-center justify-between px-6 mb-4">
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSwipeLeft}
                whileTap={{ scale: 0.85 }}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-white/70 text-lg"
              >
                ✕
              </motion.button>
              <motion.button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onSwipeRight}
                whileTap={{ scale: 0.85 }}
                className="flex items-center justify-center w-12 h-12 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm text-xl"
              >
                ❤️
              </motion.button>
            </div>

            <div className="px-5 pb-5">
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-white font-bold text-xl tracking-tight">@{flash.artistHandle}</span>
                {distLabel && <span className="text-[#888] text-xs">{distLabel}</span>}
              </div>
              {(flash.title || flash.collection) && (
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 mb-2">
                  {flash.title && <span className="text-[#888] text-sm">{flash.title}</span>}
                  {flash.title && flash.collection && <span className="text-[#555] text-sm">·</span>}
                  {flash.collection && <span className="text-[#888] text-sm">{flash.collection}</span>}
                </div>
              )}
              {priceLabel && (
                <p className="text-cream text-sm font-semibold mb-3">{priceLabel}</p>
              )}
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onDetailOpen}
                className="flex items-center justify-center gap-1 mx-auto text-white/25 hover:text-white/50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M4.5 11L9 6.5L13.5 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-xs uppercase tracking-wider">More</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Pinch hint — fades in briefly when zoomed */}
      {zoomed && (
        <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-white/30 text-xs">Pinch to zoom out</span>
        </div>
      )}
    </motion.div>
  )
}
