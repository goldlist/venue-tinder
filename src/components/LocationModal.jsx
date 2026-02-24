import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { geocodeText, reverseGeocode } from '../utils/geo'

export default function LocationModal({ currentLocation, onClose, onLocationChange }) {
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('idle') // 'idle' | 'locating' | 'searching'
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setPhase('searching')
    setError(null)
    const result = await geocodeText(input.trim())
    if (result) {
      onLocationChange(result)
      onClose()
    } else {
      setError("Couldn't find that location")
      setPhase('idle')
    }
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return
    setPhase('locating')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const label = await reverseGeocode(lat, lng)
        onLocationChange({ lat, lng, label })
        onClose()
      },
      () => { setError('Could not get location'); setPhase('idle') },
      { timeout: 10000 }
    )
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 z-40"
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-6 pb-10 pt-5"
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />

        <h2 className="text-white font-bold text-lg mb-1">Change location</h2>
        {currentLocation && (
          <p className="text-[#888] text-sm mb-5">Currently showing: {currentLocation.label}</p>
        )}

        {error && <p className="text-pass-red text-xs mb-3">{error}</p>}

        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="City, state or zip"
            autoFocus
            className="flex-1 py-3 px-4 rounded-xl bg-surface border border-border text-white placeholder-white/25 text-sm outline-none focus:border-white/25 transition-colors"
          />
          <motion.button
            type="submit"
            disabled={phase === 'searching'}
            whileTap={{ scale: 0.95 }}
            className="py-3 px-5 rounded-xl bg-cream text-[#0a0a0a] font-bold text-sm disabled:opacity-50"
          >
            {phase === 'searching' ? '…' : 'Search'}
          </motion.button>
        </form>

        <button
          onClick={handleGPS}
          disabled={phase === 'locating'}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-white/70 text-sm font-medium hover:border-white/25 transition-colors disabled:opacity-50"
        >
          {phase === 'locating' ? (
            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          ) : (
            <span>📍</span>
          )}
          {phase === 'locating' ? 'Locating…' : 'Use my current location'}
        </button>
      </motion.div>
    </>
  )
}
