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
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-border text-white/70 flex-shrink-0"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
        <p className="text-white font-semibold truncate">@{artist.handle}</p>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-gold text-sm font-medium flex-shrink-0"
        >
          Open ↗
        </a>
      </div>

      {/* Iframe */}
      <div className="flex-1">
        <iframe
          src={bookingUrl}
          title={`Book @${artist.handle}`}
          className="w-full h-full border-0"
          style={{ height: 'calc(100dvh - 5rem)' }}
          allow="payment"
        />
      </div>
    </div>
  )
}
