import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { reverseGeocode, haversine } from '../utils/geo'
import artistsData from '../data/artists.json'
import LocationAutocomplete from '../components/LocationAutocomplete'

const TOTAL_FLASH = artistsData.reduce((s, a) => s + a.flash.length, 0)
const TOTAL_ARTISTS = artistsData.length

function fmt(n) {
  return n.toLocaleString()
}

export default function OnboardingScreen({ onComplete }) {
  const [phase, setPhase] = useState('cta') // 'cta' | 'locating' | 'confirm' | 'manual'
  const [detectedLocation, setDetectedLocation] = useState(null) // { lat, lng, label }

  const handleFindArtists = () => {
    if (!navigator.geolocation) { setPhase('manual'); return }
    setPhase('locating')

    // Safety net: if neither callback fires within 12s, drop to manual
    let done = false
    const giveUp = setTimeout(() => { if (!done) setPhase('manual') }, 12000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        done = true
        clearTimeout(giveUp)
        const { latitude: lat, longitude: lng } = pos.coords
        let label
        try { label = await reverseGeocode(lat, lng) } catch { setPhase('manual'); return }
        setDetectedLocation({ lat, lng, label })
        setPhase('confirm')
      },
      () => { done = true; clearTimeout(giveUp); setPhase('manual') },
      { timeout: 10000 }
    )
  }

  const handleLocationSelect = (result) => {
    setDetectedLocation(result)
    setPhase('confirm')
  }

  // Local counts for confirmed location
  const localStats = useMemo(() => {
    if (!detectedLocation?.lat) return null
    const nearby = artistsData.filter(a =>
      a.lat != null && a.lng != null &&
      haversine(detectedLocation.lat, detectedLocation.lng, a.lat, a.lng) <= 50
    )
    return {
      artists: nearby.length,
      flash: nearby.reduce((s, a) => s + a.flash.length, 0),
    }
  }, [detectedLocation])

  const handleConfirm = () => {
    onComplete(detectedLocation)
  }

  const handleEdit = () => setPhase('manual')

  return (
    <div className="flex flex-col min-h-dvh bg-bg relative overflow-hidden">
      {/* Acid glow — top center */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,245,66,0.07) 0%, transparent 70%)' }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(212,245,66,0.04) 0%, transparent 70%)' }}
        />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex justify-center pt-16"
      >
        {/* Use the accent logo (wordmark + acid-tinted icon) */}
        <img
          src="/logos/venue-light-accent-fixed.svg"
          alt="Venue"
          height={22}
          style={{ height: 22, width: 'auto', display: 'block' }}
          draggable={false}
        />
      </motion.div>

      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative flex flex-col items-center text-center px-8 mt-14"
      >
        <h1
          className="text-[3rem] font-black text-white mb-4"
          style={{ fontFamily: "'Polymath', 'Inter', sans-serif", lineHeight: 0.92, letterSpacing: '-0.02em' }}
        >
          Find your<br />next tattoo.
        </h1>
        <p className="text-[#666] text-base font-normal leading-relaxed max-w-[260px]">
          Discover flash from artists near you.
        </p>
      </motion.div>

      {/* Stats counter */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="relative flex justify-center gap-8 mt-10 px-8"
      >
        <AnimatePresence mode="wait">
          {localStats && (phase === 'confirm') ? (
            <motion.div
              key="local"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex gap-8"
            >
              <div className="text-center">
                <p className="font-black text-3xl tracking-tight" style={{ color: '#d4f542' }}>{fmt(localStats.flash)}</p>
                <p className="text-[#555] text-xs mt-0.5 uppercase tracking-wider">flash near you</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(212,245,66,0.2)' }} />
              <div className="text-center">
                <p className="font-black text-3xl tracking-tight" style={{ color: '#d4f542' }}>{fmt(localStats.artists)}</p>
                <p className="text-[#555] text-xs mt-0.5 uppercase tracking-wider">artists near you</p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="global"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex gap-8"
            >
              <div className="text-center">
                <p className="font-black text-3xl tracking-tight" style={{ color: '#d4f542' }}>{fmt(TOTAL_FLASH)}</p>
                <p className="text-[#555] text-xs mt-0.5 uppercase tracking-wider">flash pieces</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(212,245,66,0.2)' }} />
              <div className="text-center">
                <p className="font-black text-3xl tracking-tight" style={{ color: '#d4f542' }}>{fmt(TOTAL_ARTISTS)}</p>
                <p className="text-[#555] text-xs mt-0.5 uppercase tracking-wider">artists</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Acid rule line */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="relative mx-auto mt-10"
        style={{ width: 40, height: 2, background: '#d4f542', borderRadius: 2 }}
      />

      {/* CTA area */}
      <div className="relative flex flex-col items-center px-8 mt-auto pb-16">
        <AnimatePresence mode="wait">

          {/* Initial CTA */}
          {phase === 'cta' && (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: 0.2 }}
              className="w-full"
            >
              <motion.button
                onClick={handleFindArtists}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-full font-bold text-base tracking-tight text-center"
                style={{ background: '#d4f542', color: '#0a0a0a' }}
              >
                Find artists near me
              </motion.button>
              <p className="text-center text-[#444] text-xs mt-4">
                We use your location to surface nearby artists first
              </p>
            </motion.div>
          )}

          {/* Locating */}
          {phase === 'locating' && (
            <motion.div
              key="locating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#d4f542]/20 border-t-[#d4f542] animate-spin" />
              <p className="text-[#666] text-sm">Locating you…</p>
            </motion.div>
          )}

          {/* Confirmed location */}
          {phase === 'confirm' && detectedLocation && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="w-full flex flex-col items-center gap-5"
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: 'rgba(212,245,66,0.08)', border: '1px solid rgba(212,245,66,0.2)' }}
              >
                <span className="text-sm">📍</span>
                <span className="text-white text-sm font-medium">{detectedLocation.label}</span>
                <button onClick={handleEdit} className="text-[#666] hover:text-white transition-colors ml-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 2L12 4.5L5 11.5H2.5V9L9.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <motion.button
                onClick={handleConfirm}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-full font-bold text-base text-center"
                style={{ background: '#d4f542', color: '#0a0a0a' }}
              >
                See artists near me →
              </motion.button>
            </motion.div>
          )}

          {/* Manual city entry */}
          {phase === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-3"
            >
              <p className="text-[#555] text-sm text-center">Enter your city or zip code</p>
              <LocationAutocomplete
                onSelect={handleLocationSelect}
                placeholder="Brooklyn, NY"
                autoFocus
              />
              <button
                onClick={handleFindArtists}
                className="text-[#444] text-xs text-center hover:text-white transition-colors"
              >
                Use my current location instead
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
