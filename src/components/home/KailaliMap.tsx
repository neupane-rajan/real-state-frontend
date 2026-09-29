import kailali from '../../data/kailali.json'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'

// Simplified Kailali district outline © OpenStreetMap contributors (ODbL).
const ring = kailali.geometry.coordinates[0] as number[][]

const lngs = ring.map(([lng]) => lng)
const lats = ring.map(([, lat]) => lat)
const minLng = Math.min(...lngs)
const maxLng = Math.max(...lngs)
const minLat = Math.min(...lats)
const maxLat = Math.max(...lats)

// Equirectangular projection, corrected for latitude so the shape isn't stretched.
const PAD = 24
const SCALE = 1000
const lngFactor = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180)
const WIDTH = (maxLng - minLng) * lngFactor * SCALE + PAD * 2
const HEIGHT = (maxLat - minLat) * SCALE + PAD * 2

const project = (lng: number, lat: number) => ({
  x: (lng - minLng) * lngFactor * SCALE + PAD,
  y: (maxLat - lat) * SCALE + PAD,
})

const outline =
  ring
    .map(([lng, lat], index) => {
      const { x, y } = project(lng, lat)
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ') + ' Z'

// Reference towns for orientation (OpenStreetMap town centres).
// Dhangadhi is omitted: the branch office pin already marks it.
const towns = [
  { np: 'अत्तरिया', en: 'Attariya', lat: 28.8029, lng: 80.551, dx: 10, anchor: 'start' as const },
  { np: 'टीकापुर', en: 'Tikapur', lat: 28.5283, lng: 81.1193, dx: -10, anchor: 'end' as const },
  { np: 'लम्की', en: 'Lamki', lat: 28.628, lng: 81.1529, dx: -10, anchor: 'end' as const },
]

type KailaliMapProps = {
  activeOffice: number | null
  onActiveOfficeChange: (index: number | null) => void
}

export function KailaliMap({ activeOffice, onActiveOfficeChange }: KailaliMapProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'

  return (
    <figure className="kailali-map">
      <svg
        viewBox={`0 0 ${WIDTH.toFixed(0)} ${HEIGHT.toFixed(0)}`}
        role="img"
        aria-label={
          isNp
            ? 'कैलाली जिल्लाको नक्सा: पहलमानपुरमा मुख्य कार्यालय र धनगढी-७, मनेरामा शाखा कार्यालय'
            : 'Map of Kailali district showing the head office in Pahalmanpur and the branch office in Dhangadhi-7, Manera'
        }
      >
        <path d={outline} className="kailali-map__district" />

        {towns.map((town) => {
          const { x, y } = project(town.lng, town.lat)
          return (
            <g key={town.en} className="kailali-map__town" aria-hidden="true">
              <circle cx={x} cy={y} r={4} />
              <text x={x + town.dx} y={y + 5} textAnchor={town.anchor}>
                {isNp ? town.np : town.en}
              </text>
            </g>
          )
        })}

        {companyInfo.offices.map((office, index) => {
          const { x, y } = project(office.lng, office.lat)
          const isActive = activeOffice === index
          return (
            <g
              key={office.labelEn}
              className={`kailali-map__office ${isActive ? 'is-active' : ''}`}
              transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
              onMouseEnter={() => onActiveOfficeChange(index)}
              onMouseLeave={() => onActiveOfficeChange(null)}
              aria-hidden="true"
            >
              <circle r={22} className="kailali-map__pulse" />
              {/* Map pin */}
              <path
                d="M0,0 C-11,-14 -16,-21 -16,-30 A16,16 0 1 1 16,-30 C16,-21 11,-14 0,0 Z"
                className="kailali-map__pin"
              />
              <circle cy={-30} r={6} className="kailali-map__pin-dot" />
              <text y={-72} textAnchor="middle" className="kailali-map__label">
                {isNp ? office.labelNp : office.labelEn}
              </text>
              <text y={-52} textAnchor="middle" className="kailali-map__place">
                {isNp ? office.shortPlaceNp : office.shortPlaceEn}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="kailali-map__caption">
        {isNp ? 'कैलाली जिल्ला · स्थान अनुमानित' : 'Kailali district · locations approximate'} · © OpenStreetMap
      </figcaption>
    </figure>
  )
}
