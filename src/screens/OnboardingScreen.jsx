import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { reverseGeocode, haversine } from '../utils/geo'
import artistsData from '../data/artists.json'
import VenueLogo from '../components/VenueLogo'
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
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const label = await reverseGeocode(lat, lng)
        setDetectedLocation({ lat, lng, label })
        setPhase('confirm')
      },
      () => setPhase('manual'),
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
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.02] blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex justify-center pt-16"
      >
        <VenueLogo />
      </motion.div>

      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative flex flex-col items-center text-center px-8 mt-16"
      >
        <h1 className="text-[2.75rem] font-black tracking-tight text-white leading-[1.05] mb-4">
          Find your<br />next tattoo.
        </h1>
        <p className="text-[#888] text-base font-normal leading-relaxed max-w-[260px]">
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
                <p className="text-white font-black text-3xl tracking-tight">{fmt(localStats.flash)}</p>
                <p className="text-[#888] text-xs mt-0.5 uppercase tracking-wider">flash near you</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-white font-black text-3xl tracking-tight">{fmt(localStats.artists)}</p>
                <p className="text-[#888] text-xs mt-0.5 uppercase tracking-wider">artists near you</p>
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
                <p className="text-white font-black text-3xl tracking-tight">{fmt(TOTAL_FLASH)}</p>
                <p className="text-[#888] text-xs mt-0.5 uppercase tracking-wider">flash pieces</p>
              </div>
              <div className="w-px bg-border" />
              <div className="text-center">
                <p className="text-white font-black text-3xl tracking-tight">{fmt(TOTAL_ARTISTS)}</p>
                <p className="text-[#888] text-xs mt-0.5 uppercase tracking-wider">artists</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
                className="w-full py-4 px-8 rounded-full bg-cream text-[#0a0a0a] font-bold text-base tracking-tight"
              >
                Find artists near me
              </motion.button>
              <p className="text-center text-[#888] text-xs mt-4">
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
              <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
              <p className="text-[#888] text-sm">Locating you…</p>
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
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/8 border border-white/12">
                <span className="text-sm">📍</span>
                <span className="text-white text-sm font-medium">{detectedLocation.label}</span>
                <button onClick={handleEdit} className="text-[#888] hover:text-white transition-colors ml-1">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M9.5 2L12 4.5L5 11.5H2.5V9L9.5 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <motion.button
                onClick={handleConfirm}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-full bg-cream text-[#0a0a0a] font-bold text-base"
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
              <p className="text-[#888] text-sm text-center">Enter your city or zip code</p>
              <LocationAutocomplete
                onSelect={handleLocationSelect}
                placeholder="Brooklyn, NY"
                autoFocus
              />
              <button
                onClick={handleFindArtists}
                className="text-[#888] text-xs text-center hover:text-white transition-colors"
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
