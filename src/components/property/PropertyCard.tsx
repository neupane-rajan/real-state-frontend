import { Link } from 'react-router-dom'
import {
  formatShortPrice,
  getLowestAvailablePlotPrice,
  getPropertyImageUrls,
  isPlotProject,
  type Property,
} from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { translateCategory, translateStatus } from '../../utils/translateHelpers'
import { optimizedImageUrl, optimizedSrcSet } from '../../utils/images'
import { MapPinIcon } from '../common/Icons'
import { PropertyFactsInline } from './PropertyFacts'

type PropertyCardProps = {
  property: Property
  // "row" = horizontal card for the list view of the properties page
  layout?: 'grid' | 'row'
}

export function PropertyCard({ property, layout = 'grid' }: PropertyCardProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const coverImage = getPropertyImageUrls(property)[0]
  const ownPrice = formatShortPrice(property.price, isNp)
  // Plot projects without an overall price show "from" the cheapest available plot.
  const lowestPlotPrice =
    !ownPrice && isPlotProject(property) ? formatShortPrice(getLowestAvailablePlotPrice(property.plots), isNp) : null
  const price = ownPrice ?? (lowestPlotPrice ? `${isNp ? 'सुरु' : 'From'} ${lowestPlotPrice}` : null)
  const categoryName = translateCategory(property.category?.name, language)
  const statusName = translateStatus(property.status?.name, language)
  const statusClass = property.status?.name === 'Sold'
    ? 'sold'
    : property.status?.name === 'Under Construction' ? 'progress' : 'available'

  return (
    <article className={`property-card ${layout === 'row' ? 'property-card--row' : ''}`}>
      <div className="property-card__media">
        {coverImage ? (
          <img
            src={optimizedImageUrl(coverImage, 640)}
            srcSet={optimizedSrcSet(coverImage, [400, 640, 960])}
            sizes={layout === 'row' ? '(min-width: 768px) 320px, 100vw' : '(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw'}
            alt=""
            className="property-card__image"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="property-card__placeholder" aria-hidden="true">
            {isNp ? 'तस्वीर उपलब्ध छैन' : 'No image available'}
          </div>
        )}

        <div className="property-card__badges">
          {property.isFeatured ? (
            <span className="badge-pill badge-pill--featured">{isNp ? 'विशेष' : 'Featured'}</span>
          ) : null}
          {statusName ? (
            <span className={`badge-pill property-card__status property-card__status--${statusClass}`}>{statusName}</span>
          ) : null}
        </div>

        <p className={`property-card__price-tag ${price ? '' : 'property-card__price-tag--ask'}`}>
          <span className="visually-hidden">{isNp ? 'मूल्य: ' : 'Price: '}</span>
          {price ?? (isNp ? 'मूल्यका लागि सम्पर्क' : 'Price on call')}
        </p>
      </div>

      <div className="property-card__body">
        {categoryName ? <p className="property-card__category">{categoryName}</p> : null}

        <h3 className="property-card__title">
          <Link to={`/properties/${property.id}`} className="stretched-link">
            {property.title}
          </Link>
        </h3>

        {property.address ? (
          <p className="property-card__location">
            <MapPinIcon size={15} />
            <span>{property.address}</span>
          </p>
        ) : null}

        {layout === 'row' && property.description ? (
          <p className="property-card__excerpt">{property.description.replace(/\s+/g, ' ')}</p>
        ) : null}

        <PropertyFactsInline property={property} />

        <div className="property-card__footer">
          <span className="property-card__agent">
            <img src="/logo-small.webp" alt="" width={28} height={28} loading="lazy" />
            {isNp ? 'भूमिराज रियल इस्टेट' : 'Bhumiraj Real Estate'}
          </span>
          <span className="property-card__cta" aria-hidden="true">
            {isNp ? 'विवरण हेर्नुहोस्' : 'View details'}
          </span>
        </div>
      </div>
    </article>
  )
}
