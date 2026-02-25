import { useState } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import SwipeScreen from './screens/SwipeScreen'
import LikedScreen from './screens/LikedScreen'
import BookingScreen from './screens/BookingScreen'

export default function App() {
  const [screen, setScreen] = useState('onboarding')
  const [userLocation, setUserLocation] = useState(null) // { lat, lng, label }
  const [likes, setLikes] = useState([])
  const [passes, setPasses] = useState([])
  const [selectedArtist, setSelectedArtist] = useState(null)

  const handleLikeFlash = (flashItem) => {
    setLikes(prev => prev.find(f => f.id === flashItem.id) ? prev : [...prev, flashItem])
    setPasses(prev => prev.filter(f => f.id !== flashItem.id))
  }

  const handlePassFlash = (flashItem) => {
    setPasses(prev => prev.find(f => f.id === flashItem.id) ? prev : [...prev, flashItem])
  }

  const handleBook = (artist) => {
    setSelectedArtist(artist)
    setScreen('booking')
  }

  return (
    <div className="relative w-full min-h-dvh bg-bg overflow-hidden" style={{ maxWidth: '430px', margin: '0 auto' }}>
      {screen === 'onboarding' && (
        <OnboardingScreen
          onComplete={(loc) => { setUserLocation(loc); setScreen('swipe') }}
        />
      )}
      {screen === 'swipe' && (
        <SwipeScreen
          userLocation={userLocation}
          onLocationChange={setUserLocation}
          onLikeFlash={handleLikeFlash}
          onPassFlash={handlePassFlash}
          likedCount={likes.length}
          onViewLiked={() => setScreen('liked')}
          onGoHome={() => { setLikes([]); setPasses([]); setUserLocation(null); setScreen('onboarding') }}
        />
      )}
      {screen === 'liked' && (
        <LikedScreen
          likes={likes}
          passes={passes}
          onLikeFlash={handleLikeFlash}
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
