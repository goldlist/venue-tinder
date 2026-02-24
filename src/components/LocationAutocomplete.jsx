import { useState, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { searchLocations } from '../utils/geo'

export default function LocationAutocomplete({ onSelect, placeholder = 'City, state or zip', autoFocus = false, className = '' }) {
  const [value, setValue] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  const handleChange = (e) => {
    const val = e.target.value
    setValue(val)
    setSuggestions([])

    clearTimeout(debounceRef.current)
    if (val.trim().length < 2) { setOpen(false); return }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchLocations(val.trim())
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoading(false)
    }, 400)
  }

  const handleSelect = (suggestion) => {
    setValue(suggestion.label)
    setSuggestions([])
    setOpen(false)
    onSelect(suggestion)
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full py-3.5 px-4 rounded-xl bg-surface border border-border text-white placeholder-white/25 text-sm outline-none focus:border-white/25 transition-colors pr-8"
        />
        {loading && (
          <div className="absolute right-3 w-4 h-4 rounded-full border-2 border-white/15 border-t-white/50 animate-spin pointer-events-none" />
        )}
      </div>

      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border rounded-xl overflow-hidden z-50 shadow-xl"
          >
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => e.preventDefault()} // prevent blur before click
                onClick={() => handleSelect(s)}
                className="w-full text-left px-4 py-3 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors border-b border-border/50 last:border-0 flex items-center gap-2"
              >
                <span className="text-[#555] text-xs flex-shrink-0">📍</span>
                {s.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
