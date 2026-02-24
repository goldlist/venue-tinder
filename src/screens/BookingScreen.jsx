import { motion } from 'framer-motion'

export default function BookingScreen({ artist, onBack }) {
  const bookingUrl = artist.bookingUrl || `https://venue.ink/@${artist.handle}`

  return (
    <div className="flex flex-col min-h-dvh bg-bg">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 bg-bg border-b border-border z-10">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onBack}
          className="flex items-center gap-1.5 text-white/60 text-sm font-medium"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </motion.button>
        <p className="text-white font-semibold text-sm flex-1 text-center">@{artist.handle}</p>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cream text-sm font-medium"
        >
          Open ↗
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src={bookingUrl}
          title={`Book @${artist.handle}`}
          className="w-full border-0"
          style={{ height: 'calc(100dvh - 5rem)' }}
          allow="payment"
        />
      </div>
    </div>
  )
}
