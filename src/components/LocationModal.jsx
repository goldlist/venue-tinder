import { useState } from 'react'
import { motion } from 'framer-motion'
import { reverseGeocode } from '../utils/geo'
import LocationAutocomplete from './LocationAutocomplete'

export default function LocationModal({ currentLocation, onClose, onLocationChange }) {
  const [locating, setLocating] = useState(false)

  const handleSelect = (result) => {
    onLocationChange(result)
    onClose()
  }

  const handleGPS = () => {
    if (!navigator.geolocation) return
    setLocating(true)

    // Safety net: if neither callback fires within 12s, reset so user can retry
    let done = false
    const giveUp = setTimeout(() => { if (!done) setLocating(false) }, 12000)

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        done = true
        clearTimeout(giveUp)
        const { latitude: lat, longitude: lng } = pos.coords
        let label
        try { label = await reverseGeocode(lat, lng) } catch { setLocating(false); return }
        onLocationChange({ lat, lng, label })
        onClose()
      },
      () => { done = true; clearTimeout(giveUp); setLocating(false) },
      { timeout: 10000 }
    )
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 z-40"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-6 pb-10 pt-5"
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-6" />
        <h2 className="text-white font-bold text-lg mb-1">Change location</h2>
        {currentLocation && (
          <p className="text-[#888] text-sm mb-5">Currently: {currentLocation.label}</p>
        )}

        <LocationAutocomplete
          onSelect={handleSelect}
          placeholder="Brooklyn, NY"
          autoFocus
          className="mb-4"
        />

        <button
          onClick={handleGPS}
          disabled={locating}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-white/70 text-sm font-medium hover:border-white/25 transition-colors disabled:opacity-50"
        >
          {locating
            ? <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            : <span>📍</span>
          }
          {locating ? 'Locating…' : 'Use my current location'}
        </button>
      </motion.div>
    </>
  )
}
