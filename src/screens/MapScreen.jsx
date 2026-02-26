import { useState, useRef, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimationControls } from 'framer-motion'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatDistance } from '../utils/geo'

// ─── Mock data (pins placed in NYC/Brooklyn for demo) ─────────────────────

const I = (p) => `https://venue.ink/static/people/${p}`

const MOCK_PINS = [
  {
    id: 1, lat: 40.6892, lng: -73.9796,
    imgs: [I('per-8lZLWK6Oqlk/flash_images/fli-8lZPZntP0kK/flash.0f22eb27.webp')],
    artists: [{ handle: '040luckypennytattoo', location: 'Prospect Heights', distance: 0.8, flashCount: 41 }],
  },
  {
    id: 2, lat: 40.7021, lng: -73.9532,
    imgs: [
      I('per-8kAqKR0OSB6/flash_images/fli-8kAt3DOkY7M/flash.e5631da4.webp'),
      I('per-8pi9AJE3hC4/flash_images/fli-8qy87DyyTAW/flash.8e518323.webp'),
      I('per-8jv9TDVsm3c/flash_images/fli-8lb79PdE1QG/flash.73001383.webp'),
    ],
    artists: [
      { handle: '1127.tattoo', location: 'Bushwick', distance: 1.2, flashCount: 18 },
      { handle: '1.800.tattoo.me', location: 'Bushwick', distance: 1.2, flashCount: 9 },
      { handle: '1nkby.cj', location: 'Bushwick', distance: 1.2, flashCount: 24 },
    ],
  },
  {
    id: 3, lat: 40.7143, lng: -73.9614,
    imgs: [I('per-8ldcDS8zFE8/flash_images/fli-8ldoV9ZrTgu/flash.5bba5e43.webp')],
    artists: [{ handle: '0lly._.createz', location: 'Williamsburg', distance: 3.1, flashCount: 12 }],
  },
  {
    id: 4, lat: 40.6762, lng: -73.9754,
    imgs: [
      I('per-8nwmnjw5Cym/flash_images/fli-8nwrki56daC/flash.d5716276.webp'),
      I('per-8gbHcPhu2wS/flash_images/fli-8o1zt961nuq/flash.ae0f151d.webp'),
    ],
    artists: [
      { handle: '1001prickz', location: 'Park Slope', distance: 4.5, flashCount: 33 },
      { handle: '107taay', location: 'Park Slope', distance: 4.5, flashCount: 7 },
    ],
  },
  {
    id: 5, lat: 40.7218, lng: -74.0078,
    imgs: [I('per-8qINq2Jlw4e/flash_images/fli-8qIRYStkWfI/flash.3c92e3ff.webp')],
    artists: [{ handle: '116iiixteentz', location: 'West Village', distance: 6.2, flashCount: 19 }],
  },
]

const MOCK_FLASH = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-${i}`,
  title: ['Beetle jewels', 'Celestial moon', 'Sleepy cat', 'Fine line leaves', 'Old swallow', 'Moth & flowers', 'Pisces card', 'Sun & moon', 'Snake rose', 'Dagger heart', 'Skull flowers', 'Frog on lily'][i],
  collection: ['Nature', 'Celestial', 'Animals', 'Botanical', 'Traditional', 'Floral', 'Tarot', 'Celestial', 'Dark', 'Dark', 'Dark', 'Nature'][i],
  imageUrl: null,
  priceMin: [200, 150, 300, 180, 250, 350, 400, 175, 225, 300, 280, 320][i],
  sizes: [
    { size: 'S', price: [150, 120, 200, 140, 180, 250, 300, 130, 160, 220, 200, 240][i], duration: 60 },
    { size: 'M', price: [200, 150, 300, 180, 250, 350, 400, 175, 225, 300, 280, 320][i], duration: 120 },
  ],
}))

// ─── Custom Leaflet DivIcon (mirrors ImagePin visually) ────────────────────

function createPinIcon(imgs, artistCount, flashCount) {
  const SIZE = 100
  const R = 14
  const multi = artistCount > 1
  const stackImgs = imgs.slice(0, 3)
  const offsets = [
    { r: -6, x: -5, y: 3, z: 0 },
    { r:  4, x:  4, y: 2, z: 1 },
    { r:  0, x:  0, y: 0, z: 2 },
  ]
  const layers = stackImgs.length === 1 ? offsets.slice(2)
    : stackImgs.length === 2 ? offsets.slice(1)
    : offsets

  // Gold border for multi-artist pins; white for single-artist
  const borderColor = multi ? '#d4a853' : '#fff'

  const cards = layers.map((off, i) => {
    const src = stackImgs[i] || stackImgs[stackImgs.length - 1]
    const isFront = i === layers.length - 1
    const shadow = isFront
      ? '0 4px 16px rgba(0,0,0,0.75)'
      : '0 2px 8px rgba(0,0,0,0.45)'
    // Flash count badge — bottom-right, shows total flash available
    const flashBadge = isFront && flashCount > 1
      ? `<div style="position:absolute;bottom:5px;right:5px;background:rgba(0,0,0,0.7);border-radius:6px;padding:2px 6px;font-size:10px;font-weight:700;color:#fff;font-family:sans-serif">${flashCount}</div>`
      : ''
    // Multi-artist badge — top-left, gold pill with artist count
    const artistBadge = isFront && multi
      ? `<div style="position:absolute;top:5px;left:5px;background:#d4a853;border-radius:5px;padding:2px 6px;font-size:10px;font-weight:800;color:#0a0a0a;font-family:sans-serif">${artistCount} artists</div>`
      : ''
    return `<div style="position:absolute;top:0;left:0;width:${SIZE}px;height:${SIZE}px;border-radius:${R}px;overflow:hidden;border:2.5px solid ${borderColor};background:#f0f0f0;box-shadow:${shadow};transform:rotate(${off.r}deg) translate(${off.x}px,${off.y}px);z-index:${off.z}">
      <img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block" draggable="false" onerror="this.style.visibility='hidden'"/>
      ${flashBadge}
      ${artistBadge}
    </div>`
  }).join('')

  return L.divIcon({
    html: `<div style="position:relative;width:${SIZE + 12}px;height:${SIZE + 10}px">${cards}</div>`,
    className: '',
    iconSize: [SIZE + 12, SIZE + 10],
    iconAnchor: [(SIZE + 12) / 2, (SIZE + 10) / 2],
  })
}

// ─── Real Leaflet map (vanilla, no react-leaflet) ────────────────────────

function RealMap({ onPinTap }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  // Keep onPinTap in a ref so the Leaflet click handlers always get the latest
  const onPinTapRef = useRef(onPinTap)
  useEffect(() => { onPinTapRef.current = onPinTap }, [onPinTap])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, {
      center: [40.697, -73.968],
      zoom: 13,
      zoomControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
    }).addTo(map)

    MOCK_PINS.forEach(pin => {
      const totalFlash = pin.artists.reduce((sum, a) => sum + a.flashCount, 0)
      L.marker([pin.lat, pin.lng], { icon: createPinIcon(pin.imgs, pin.artists.length, totalFlash) })
        .addTo(map)
        .on('click', () => onPinTapRef.current(pin))
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // zIndex: 0 forces a new stacking context so Leaflet's internal z-indexes
  // (marker pane: 600, etc.) are contained here and don't bleed above the
  // ArtistSheet (z-40/z-50) which is rendered outside this element.
  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
}

// ─── Swipeable flash card ─────────────────────────────────────────────────

const MapFlashCard = forwardRef(function MapFlashCard({ flash, onLike, onPass }, ref) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-160, 160], [-14, 14])
  const likeOpacity = useTransform(x, [20, 80], [0, 1])
  const passOpacity = useTransform(x, [-80, -20], [1, 0])
  const controls = useAnimationControls()
  // Native ref so we can stop DOM-level propagation before the sheet's
  // Framer Motion drag handler (which uses native listeners) sees the event.
  const divRef = useRef()

  const flyOut = useCallback((dir, callback) => {
    controls.start({
      x: dir * 500,
      opacity: 0,
      transition: { duration: 0.28, ease: [0.2, 0, 0.6, 1] },
    }).then(callback)
  }, [controls])

  useImperativeHandle(ref, () => ({
    swipeLike: () => flyOut(1, onLike),
    swipePass: () => flyOut(-1, onPass),
  }), [flyOut, onLike, onPass])

  // Stop native pointerdown from bubbling to the sheet's drag="y" handler.
  // React's synthetic stopPropagation doesn't reach Framer Motion's native
  // DOM listeners — this native listener fires during the bubble phase and
  // prevents the sheet from activating while the card is being swiped.
  useEffect(() => {
    const el = divRef.current
    if (!el) return
    const stop = e => e.stopPropagation()
    el.addEventListener('pointerdown', stop)
    return () => el.removeEventListener('pointerdown', stop)
  }, [])

  const handleDragEnd = (_, info) => {
    const { x: ox } = info.offset
    const { x: vx } = info.velocity
    if (ox > 60 || vx > 400) flyOut(1, onLike)
    else if (ox < -60 || vx < -400) flyOut(-1, onPass)
    else controls.start({ x: 0, transition: { type: 'spring', stiffness: 500, damping: 30 } })
  }

  return (
    <motion.div
      ref={divRef}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      animate={controls}
      style={{ x, rotate, touchAction: 'none', width: '55vw', maxWidth: 220, aspectRatio: '1' }}
      className="relative rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing flex-shrink-0"
    >
      <div className="absolute inset-0" style={{ background: '#ffffff' }}>
        {flash.imageUrl ? (
          <img src={flash.imageUrl} alt={flash.title} draggable={false}
            className="w-full h-full" style={{ objectFit: 'contain', pointerEvents: 'none' }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: `hsl(${parseInt(flash.id.split('-')[1]) * 37}, 12%, 90%)` }}>
            <span className="text-4xl opacity-20">✦</span>
          </div>
        )}
      </div>

      <motion.div style={{ opacity: likeOpacity, background: 'rgba(212,168,83,0.18)' }}
        className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ opacity: likeOpacity }} className="absolute top-3 right-3 pointer-events-none">
        <div style={{ padding: '4px 10px', border: '2.5px solid #d4a853', borderRadius: 6,
          color: '#d4a853', fontSize: 16, fontWeight: 900, letterSpacing: '0.08em',
          transform: 'rotate(-12deg)', textShadow: '0 0 16px rgba(212,168,83,0.8)' }}>LIKE</div>
      </motion.div>

      <motion.div style={{ opacity: passOpacity, background: 'rgba(255,51,86,0.18)' }}
        className="absolute inset-0 pointer-events-none" />
      <motion.div style={{ opacity: passOpacity }} className="absolute top-3 left-3 pointer-events-none">
        <div style={{ padding: '4px 10px', border: '2.5px solid #ff3356', borderRadius: 6,
          color: '#ff3356', fontSize: 16, fontWeight: 900, letterSpacing: '0.08em',
          transform: 'rotate(12deg)', textShadow: '0 0 16px rgba(255,51,86,0.8)' }}>NOPE</div>
      </motion.div>

      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg text-[11px] font-bold"
        style={{ background: 'rgba(0,0,0,0.6)', color: '#d4a853' }}>${flash.priceMin}</div>
    </motion.div>
  )
})

// ─── Artist Sheet ─────────────────────────────────────────────────────────

function ArtistSheet({ pin, userLocation, onClose, onLikeFlash, onPassFlash, likes }) {
  const [view, setView] = useState(pin.artists.length === 1 ? 'artist' : 'list')
  const [activeArtist, setActiveArtist] = useState(pin.artists.length === 1 ? pin.artists[0] : null)
  const [flashIdx, setFlashIdx] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const cardRef = useRef()

  // Auto-hide the swipe hint after 2.2 s
  useEffect(() => {
    if (!showHint) return
    const t = setTimeout(() => setShowHint(false), 2200)
    return () => clearTimeout(t)
  }, [showHint])

  const goArtist = (artist) => { setActiveArtist(artist); setView('artist'); setFlashIdx(0) }
  const goBack = () => {
    if (view === 'artist' && pin.artists.length > 1) { setActiveArtist(null); setView('list') }
    else onClose()
  }

  const buildFlashItem = useCallback((flash) => ({
    ...flash,
    handle: activeArtist?.handle,
    artistName: activeArtist?.handle,
    bookingUrl: `https://venue.ink/@${activeArtist?.handle}`,
  }), [activeArtist])

  const advanceLike = useCallback(() => {
    onLikeFlash?.(buildFlashItem(MOCK_FLASH[flashIdx]))
    setFlashIdx(i => i + 1)
  }, [flashIdx, buildFlashItem, onLikeFlash])

  const advancePass = useCallback(() => {
    onPassFlash?.(buildFlashItem(MOCK_FLASH[flashIdx]))
    setFlashIdx(i => i + 1)
  }, [flashIdx, buildFlashItem, onPassFlash])

  const tapLike = () => cardRef.current?.swipeLike()
  const tapPass = () => cardRef.current?.swipePass()
  const allDone = flashIdx >= MOCK_FLASH.length

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 z-40"
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        drag="y" dragConstraints={{ top: 0 }} dragElastic={0.15}
        onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
        className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-border"
        style={{ background: '#141414', maxHeight: '82vh', display: 'flex', flexDirection: 'column' }}
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mt-4 mb-1 flex-shrink-0" />

        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div key="list"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }} className="flex flex-col overflow-hidden"
            >
              <div className="px-5 py-3 flex-shrink-0">
                <p className="text-white font-bold text-base">{pin.artists.length} artists</p>
                <p className="text-[#666] text-sm">{pin.artists[0].location}</p>
              </div>
              <div className="overflow-y-auto pb-8">
                {pin.artists.map((artist, i) => (
                  <button key={i} onClick={() => goArtist(artist)}
                    className="w-full flex items-center gap-3 px-5 py-3.5 border-t border-border hover:bg-white/5 transition-colors text-left">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white/20 text-lg"
                      style={{ background: '#222' }}>✦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">@{artist.handle}</p>
                      <p className="text-[#666] text-xs">{artist.flashCount} flash available</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 4l4 4-4 4" stroke="#444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'artist' && activeArtist && (
            <motion.div key={`artist-${activeArtist.handle}`}
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }} className="flex flex-col overflow-hidden"
              style={{ maxHeight: 'calc(82vh - 28px)' }}
            >
              <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0">
                {pin.artists.length > 1 && (
                  <button onClick={goBack} className="text-[#666] hover:text-white transition-colors -ml-1 mr-1">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M12 5l-5 5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white/20"
                  style={{ background: '#222' }}>✦</div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">@{activeArtist.handle}</p>
                  <p className="text-[#666] text-xs">
                    {activeArtist.location}
                    {activeArtist.distance != null && ` · ${formatDistance(activeArtist.distance)}`}
                  </p>
                </div>
              </div>

              <div className="flex-1 flex flex-col items-center px-5 pb-5 min-h-0">
                {allDone ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <p className="text-2xl mb-3">✦</p>
                    <p className="text-white font-bold text-base mb-1">All caught up!</p>
                    <p className="text-[#555] text-sm mb-4">You've seen all flash from @{activeArtist.handle}</p>
                  </div>
                ) : (
                  <>
                    <motion.div
                      key={flashIdx}
                      initial={{ opacity: 0, scale: 0.93 }}
                      animate={{ opacity: 1, scale: 1, transition: { duration: 0.18 } }}
                      className="flex flex-col items-center flex-1 min-h-0 justify-center w-full"
                    >
                      <MapFlashCard
                        ref={cardRef}
                        flash={MOCK_FLASH[flashIdx]}
                        onLike={advanceLike}
                        onPass={advancePass}
                      />

                      {/* Swipe hint — shown on first card, fades after 2s */}
                      <AnimatePresence>
                        {flashIdx === 0 && showHint && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.35 } }}
                            exit={{ opacity: 0, transition: { duration: 0.5 } }}
                            className="flex items-center justify-between mt-3 pointer-events-none"
                            style={{ width: '55vw', maxWidth: 220 }}
                          >
                            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'rgba(255,51,86,0.7)' }}>
                              ← PASS
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: 'rgba(212,168,83,0.9)' }}>
                              LIKE
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <path d="M5.5 9.5S1 6.5 1 3.8a2.2 2.2 0 0 1 4.5-.15A2.2 2.2 0 0 1 10 3.8C10 6.5 5.5 9.5 5.5 9.5z"
                                  fill="#d4a853" stroke="#d4a853" strokeWidth="0.5"/>
                              </svg>
                              →
                            </span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="text-center mt-3 mb-0.5">
                        <p className="text-white font-semibold text-sm">{MOCK_FLASH[flashIdx].title}</p>
                        {MOCK_FLASH[flashIdx].collection && (
                          <p className="text-[#555] text-xs mt-0.5">{MOCK_FLASH[flashIdx].collection}</p>
                        )}
                      </div>
                      <p className="text-[#444] text-xs mt-1 mb-4">{flashIdx + 1} / {MOCK_FLASH.length}</p>
                    </motion.div>

                    <div className="flex gap-4 w-full justify-center mb-5 flex-shrink-0">
                      <motion.button whileTap={{ scale: 0.93 }} onClick={tapPass}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm border border-border"
                        style={{ background: '#1a1a1a', color: '#888', maxWidth: 140 }}>
                        <span>✕</span> PASS
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.93 }} onClick={tapLike}
                        className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                        style={{ background: '#d4a853', color: '#0a0a0a', maxWidth: 140 }}>
                        <span>♡</span> LIKE
                      </motion.button>
                    </div>
                  </>
                )}

                <motion.a whileTap={{ scale: 0.97 }}
                  href={`https://venue.ink/@${activeArtist.handle}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-4 rounded-2xl font-bold text-base flex-shrink-0"
                  style={{ background: '#d4f542', color: '#0a0a0a' }}>
                  Book @{activeArtist.handle} →
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function MapScreen({ userLocation, onBack, onLikeFlash, onPassFlash, likes, likedCount = 0, onViewLiked }) {
  const [selectedPin, setSelectedPin] = useState(null)

  return (
    <div className="absolute inset-0 bg-bg overflow-hidden">
      <RealMap onPinTap={setSelectedPin} />

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-12 pb-3 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(10,10,10,0.8) 0%, transparent 100%)' }}>
        <motion.button whileTap={{ scale: 0.95 }} onClick={onBack}
          className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-white/8 border border-white/10">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <span className="text-white text-sm font-semibold">Explore by map</span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onViewLiked}
          className="pointer-events-auto flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white/8 border border-white/10 text-white text-xs font-medium"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 12S1.5 8 1.5 4.5a2.5 2.5 0 0 1 5-0.2A2.5 2.5 0 0 1 12.5 4.5C12.5 8 7 12 7 12z"
              fill={likedCount > 0 ? '#d4a853' : 'none'}
              stroke={likedCount > 0 ? '#d4a853' : 'white'}
              strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {likedCount > 0 ? (
            <span style={{ color: '#d4a853' }}>{likedCount}</span>
          ) : (
            <span className="text-white/50">Liked</span>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {selectedPin && (
          <ArtistSheet
            pin={selectedPin}
            userLocation={userLocation}
            onClose={() => setSelectedPin(null)}
            onLikeFlash={onLikeFlash}
            onPassFlash={onPassFlash}
            likes={likes}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
