import { useState } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import SwipeScreen from './screens/SwipeScreen'
import LikedScreen from './screens/LikedScreen'
import BookingScreen from './screens/BookingScreen'

export default function App() {
  const [screen, setScreen] = useState('onboarding') // 'onboarding' | 'swipe' | 'liked' | 'booking'
  const [likedArtists, setLikedArtists] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)

  const handleLocationGranted = () => setScreen('swipe')

  const handleLike = (artist) => {
    setLikedArtists(prev => {
      if (prev.find(a => a.handle === artist.handle)) return prev
      return [...prev, artist]
    })
  }

  const handleViewLiked = () => setScreen('liked')

  const handleBook = (artist) => {
    setSelectedArtist(artist)
    setScreen('booking')
  }

  const handleBackToSwipe = () => setScreen('swipe')
  const handleBackToLiked = () => setScreen('liked')

  return (
    <div className="relative w-full min-h-dvh bg-bg overflow-hidden" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {screen === 'onboarding' && (
        <OnboardingScreen onGranted={handleLocationGranted} />
      )}
      {screen === 'swipe' && (
        <SwipeScreen
          onLike={handleLike}
          likedCount={likedArtists.length}
          onViewLiked={handleViewLiked}
        />
      )}
      {screen === 'liked' && (
        <LikedScreen
          artists={likedArtists}
          onBook={handleBook}
          onBack={handleBackToSwipe}
        />
      )}
      {screen === 'booking' && selectedArtist && (
        <BookingScreen
          artist={selectedArtist}
          onBack={handleBackToLiked}
        />
      )}
    </div>
  )
}
