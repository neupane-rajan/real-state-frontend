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

export function PropertyCard({ property }: { property: Property }) {
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
  const isSold = property.status?.name === 'Sold'

  return (
    <article className="property-card">
      <div className="property-card__media">
        {coverImage ? (
          <img
            src={optimizedImageUrl(coverImage, 640)}
            srcSet={optimizedSrcSet(coverImage, [400, 640, 960])}
            sizes="(min-width: 992px) 33vw, (min-width: 768px) 50vw, 100vw"
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
            <span className={`badge-pill ${isSold ? 'badge-pill--sold' : 'badge-pill--status'}`}>{statusName}</span>
          ) : null}
        </div>
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

        <PropertyFactsInline property={property} />

        <div className="property-card__footer">
          {price ? (
            <p className="property-card__price">
              <span className="visually-hidden">{isNp ? 'मूल्य: ' : 'Price: '}</span>
              {price}
            </p>
          ) : (
            <p className="property-card__price property-card__price--muted">
              {isNp ? 'मूल्यका लागि सम्पर्क गर्नुहोस्' : 'Contact for price'}
            </p>
          )}
          <span className="property-card__cta" aria-hidden="true">
            {isNp ? 'विवरण' : 'View details'} →
          </span>
        </div>
      </div>
    </article>
  )
}
