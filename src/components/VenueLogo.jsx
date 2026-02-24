// Uses the real Venue brand SVGs from /public/logos/
export default function VenueLogo({ size = 'md' }) {
  // venue-light.svg is the full horizontal wordmark (cream, for dark backgrounds)
  // sizes: sm = header, md = onboarding
  const height = size === 'sm' ? 16 : size === 'lg' ? 32 : 22
  const width = height * 4 // venue-light.svg is 96x24 = 4:1 ratio

  return (
    <img
      src="/logos/venue-light.svg"
      alt="Venue"
      width={width}
      height={height}
      style={{ display: 'block' }}
      draggable={false}
    />
  )
}
