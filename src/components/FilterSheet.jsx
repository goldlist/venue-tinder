import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']
const PRICE_OPTIONS = [
  { label: 'Any', value: null },
  { label: '≤$200', value: 200 },
  { label: '≤$400', value: 400 },
  { label: '≤$600', value: 600 },
]
const DURATION_OPTIONS = [
  { label: 'Any', value: null },
  { label: '≤1h', value: 60 },
  { label: '≤2h', value: 120 },
  { label: '≤3h', value: 180 },
]

export default function FilterSheet({ filters, onApply, onClose }) {
  const [local, setLocal] = useState({ ...filters, sizes: [...filters.sizes] })

  function toggleSize(s) {
    setLocal(prev => ({
      ...prev,
      sizes: prev.sizes.includes(s) ? prev.sizes.filter(x => x !== s) : [...prev.sizes, s],
    }))
  }

  function clearAll() {
    onApply({ sizes: [], maxPrice: null, maxDuration: null })
    onClose()
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.15}
        onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
        className="absolute bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border-t border-border px-5 pb-12 pt-4"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-white/15 mx-auto mb-5" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-lg">Filters</h2>
          <button
            onClick={clearAll}
            className="text-[#888] text-sm hover:text-white transition-colors"
          >
            Clear all
          </button>
        </div>

        {/* Size */}
        <div className="mb-6">
          <p className="text-[#888] text-[10px] uppercase tracking-wider mb-3">Size</p>
          <div className="flex gap-2 flex-wrap">
            {SIZE_OPTIONS.map(s => {
              const active = local.sizes.includes(s)
              return (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                  style={active
                    ? { borderColor: '#d4a853', color: '#d4a853', background: 'rgba(212,168,83,0.1)' }
                    : { borderColor: '#2a2a2a', color: '#888' }
                  }
                >
                  {s}
                </button>
              )
            })}
          </div>
        </div>

        {/* Max price */}
        <div className="mb-6">
          <p className="text-[#888] text-[10px] uppercase tracking-wider mb-3">Max Price</p>
          <div className="flex gap-2 flex-wrap">
            {PRICE_OPTIONS.map(opt => {
              const active = local.maxPrice === opt.value
              return (
                <button
                  key={opt.label}
                  onClick={() => setLocal(prev => ({ ...prev, maxPrice: opt.value }))}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                  style={active
                    ? { borderColor: '#d4a853', color: '#d4a853', background: 'rgba(212,168,83,0.1)' }
                    : { borderColor: '#2a2a2a', color: '#888' }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Max duration */}
        <div className="mb-8">
          <p className="text-[#888] text-[10px] uppercase tracking-wider mb-3">Max Session</p>
          <div className="flex gap-2 flex-wrap">
            {DURATION_OPTIONS.map(opt => {
              const active = local.maxDuration === opt.value
              return (
                <button
                  key={opt.label}
                  onClick={() => setLocal(prev => ({ ...prev, maxDuration: opt.value }))}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                  style={active
                    ? { borderColor: '#d4a853', color: '#d4a853', background: 'rgba(212,168,83,0.1)' }
                    : { borderColor: '#2a2a2a', color: '#888' }
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Apply */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { onApply(local); onClose() }}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{ background: '#d4f542', color: '#0a0a0a' }}
        >
          Apply filters
        </motion.button>
      </motion.div>
    </>
  )
}
