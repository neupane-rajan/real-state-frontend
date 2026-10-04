import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { cardPrice, getPropertyImageUrls, type Property } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl } from '../../utils/images'
import { translateCategory, translateStatus } from '../../utils/translateHelpers'
import { ChevronLeftIcon, ChevronRightIcon, MapPinIcon } from '../common/Icons'
import { PropertyFactsInline } from '../property/PropertyFacts'

const ROTATE_MS = 6000

// Featured listings shown over the hero photo (desktop), one at a time with arrows and dots.
export function HeroFeatured({ listings }: { listings: Property[] }) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = listings.length

  // Advance automatically unless the visitor is hovering/focused or prefers reduced motion.
  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [count, paused])

  if (count === 0) return null
  const property = listings[index % count]
  const image = getPropertyImageUrls(property)[0]
  const price = cardPrice(property, isNp)
  const go = (step: number) => setIndex((current) => (current + step + count) % count)

  return (
    <aside
      className="hero-featured"
      aria-label={isNp ? 'विशेष सम्पत्ति' : 'Featured properties'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Link to={`/properties/${property.id}`} className="hero-featured__card">
        <div className="hero-featured__media">
          {image ? <img key={property.id} src={optimizedImageUrl(image, 720)} alt="" /> : null}
          <span className="hero-featured__badge">{isNp ? 'विशेष' : 'Featured'}</span>
          <span className="hero-featured__price">{price ?? (isNp ? 'मूल्यका लागि सम्पर्क' : 'Price on call')}</span>
        </div>
        <div className="hero-featured__body">
          <p className="hero-featured__type">
            {translateCategory(property.category?.name, language)}
            {property.status?.name ? <span>{translateStatus(property.status.name, language)}</span> : null}
          </p>
          <strong className="hero-featured__title">{property.title}</strong>
          <p className="hero-featured__place">
            <MapPinIcon size={14} />
            <span>{property.address}</span>
          </p>
          <PropertyFactsInline property={property} />
        </div>
      </Link>

      {count > 1 ? (
        <div className="hero-featured__nav">
          <button type="button" onClick={() => go(-1)} aria-label={isNp ? 'अघिल्लो' : 'Previous featured property'}>
            <ChevronLeftIcon size={18} />
          </button>
          <div className="hero-featured__dots">
            {listings.map((item, i) => (
              <button
                key={item.id}
                type="button"
                className={i === index % count ? 'is-active' : ''}
                aria-label={`${i + 1} / ${count}`}
                aria-current={i === index % count}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button type="button" onClick={() => go(1)} aria-label={isNp ? 'अर्को' : 'Next featured property'}>
            <ChevronRightIcon size={18} />
          </button>
        </div>
      ) : null}
    </aside>
  )
}
