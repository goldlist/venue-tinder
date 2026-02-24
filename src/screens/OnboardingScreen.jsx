import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function OnboardingScreen({ onGranted }) {
  const [status, setStatus] = useState('idle') // 'idle' | 'requesting' | 'denied'
  const [cityInput, setCityInput] = useState('')

  const handleFindArtists = () => {
    if (!navigator.geolocation) {
      setStatus('denied')
      return
    }
    setStatus('requesting')
    navigator.geolocation.getCurrentPosition(
      () => onGranted(),
      () => setStatus('denied'),
      { timeout: 8000 }
    )
  }

  const handleCitySubmit = (e) => {
    e.preventDefault()
    if (cityInput.trim()) onGranted()
  }

  return (
    <div className="flex flex-col min-h-dvh bg-bg relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#1a0a00]/60 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#0a0500]/80 to-transparent" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-gold/8 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex flex-col flex-1 items-center justify-center px-8 text-center">
        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold/10 border border-gold/20 mb-8">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C16 4 6 10 6 18C6 23.523 10.477 28 16 28C21.523 28 26 23.523 26 18C26 10 16 4 16 4Z" fill="#d4a853" opacity="0.9"/>
              <path d="M16 10C16 10 11 14 11 18C11 20.761 13.239 23 16 23C18.761 23 21 20.761 21 18C21 14 16 10 16 10Z" fill="#0a0a0a"/>
            </svg>
          </div>

          <h1 className="text-5xl font-black tracking-tight text-white mb-3 leading-none">
            Discover
          </h1>
          <p className="text-lg text-white/50 font-medium">
            Find your next tattoo artist.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {status !== 'denied' ? (
            <motion.div
              key="cta"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full"
            >
              <motion.button
                onClick={handleFindArtists}
                disabled={status === 'requesting'}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 px-8 rounded-2xl bg-gold text-[#0a0a0a] font-bold text-lg tracking-tight disabled:opacity-50 transition-opacity"
              >
                {status === 'requesting' ? 'Locating you...' : 'Find artists near me'}
              </motion.button>
              <p className="mt-4 text-white/30 text-sm">
                We use your location to show nearby artists
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="city"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              <p className="text-white/60 text-sm mb-4">
                No problem — enter your city to continue
              </p>
              <form onSubmit={handleCitySubmit} className="flex gap-3">
                <input
                  type="text"
                  value={cityInput}
                  onChange={e => setCityInput(e.target.value)}
                  placeholder="New York, NY"
                  autoFocus
                  className="flex-1 py-4 px-5 rounded-xl bg-surface border border-border text-white placeholder-white/30 text-base outline-none focus:border-gold/50 transition-colors"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.95 }}
                  className="py-4 px-6 rounded-xl bg-gold text-[#0a0a0a] font-bold"
                >
                  Go
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative pb-10 text-center"
      >
        <p className="text-white/20 text-xs tracking-wider uppercase">Powered by Venue</p>
      </motion.div>
    </div>
  )
}
