import { useState } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import SwipeScreen from './screens/SwipeScreen'
import LikedScreen from './screens/LikedScreen'
import BookingScreen from './screens/BookingScreen'

export default function App() {
  const [screen, setScreen] = useState('onboarding')
  // likes: array of flash items with artist context attached
  const [likes, setLikes] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)

  const handleLikeFlash = (flashItem) => {
    setLikes(prev => {
      if (prev.find(f => f.id === flashItem.id)) return prev
      return [...prev, flashItem]
    })
  }

  const handleBook = (artist) => {
    setSelectedArtist(artist)
    setScreen('booking')
  }

  return (
    <div className="relative w-full min-h-dvh bg-bg overflow-hidden" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {screen === 'onboarding' && (
        <OnboardingScreen onGranted={() => setScreen('swipe')} />
      )}
      {screen === 'swipe' && (
        <SwipeScreen
          onLikeFlash={handleLikeFlash}
          likedCount={likes.length}
          onViewLiked={() => setScreen('liked')}
        />
      )}
      {screen === 'liked' && (
        <LikedScreen
          likes={likes}
          onBook={handleBook}
          onBack={() => setScreen('swipe')}
        />
      )}
      {screen === 'booking' && selectedArtist && (
        <BookingScreen
          artist={selectedArtist}
          onBack={() => setScreen('liked')}
        />
      )}
    </div>
  )
}
