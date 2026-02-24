import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geocodeText, reverseGeocode } from '../utils/geo'

// Venue wordmark SVG (ink-drop + text)
function VenueLogo() {
  return (
    <div className="flex items-center gap-2">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C16 4 6 10 6 18C6 23.523 10.477 28 16 28C21.523 28 26 23.523 26 18C26 10 16 4 16 4Z" fill="#F5F0E8" opacity="0.9"/>
        <path d="M16 10C16 10 11 14 11 18C11 20.761 13.239 23 16 23C18.761 23 21 20.761 21 18C21 14 16 10 16 10Z" fill="#0a0a0a"/>
      </svg>
      <span className="text-2xl font-black tracking-tight text-white">venue</span>
    </div>
  )
}

export default function OnboardingScreen({ onComplete }) {
  const [phase, setPhase] = useState('cta') // 'cta' | 'locating' | 'confirm' | 'manual' | 'searching'
  const [detectedLocation, setDetectedLocation] = useState(null) // { lat, lng, label }
  const [cityInput, setCityInput] = useState('')
  const [error, setError] = useState(null)

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

  const handleCitySearch = async (e) => {
    e.preventDefault()
    if (!cityInput.trim()) return
    setPhase('searching')
    setError(null)
    const result = await geocodeText(cityInput.trim())
    if (result) {
      setDetectedLocation(result)
      setPhase('confirm')
    } else {
      setError("Couldn't find that location — try a city name or zip code")
      setPhase('manual')
    }
  }

  const handleConfirm = () => {
    onComplete(detectedLocation)
  }

  const handleEdit = () => {
    setCityInput(detectedLocation?.label || '')
    setPhase('manual')
  }

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
          {(phase === 'manual' || phase === 'searching') && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col gap-3"
            >
              {error && (
                <p className="text-pass-red text-xs text-center">{error}</p>
              )}
              <p className="text-[#888] text-sm text-center">Enter your city or zip code</p>
              <form onSubmit={handleCitySearch} className="flex gap-2">
                <input
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  placeholder="New York, NY"
                  autoFocus
                  className="flex-1 py-3.5 px-4 rounded-xl bg-surface border border-border text-white placeholder-white/25 text-sm outline-none focus:border-white/25 transition-colors"
                />
                <motion.button
                  type="submit"
                  disabled={phase === 'searching'}
                  whileTap={{ scale: 0.95 }}
                  className="py-3.5 px-5 rounded-xl bg-cream text-[#0a0a0a] font-bold text-sm disabled:opacity-50"
                >
                  {phase === 'searching' ? '…' : 'Go'}
                </motion.button>
              </form>
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
