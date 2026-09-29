import { useState } from 'react'
import { getPropertyImageUrls, type Property } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl, optimizedSrcSet } from '../../utils/images'

export function PropertyGallery({ property }: { property: Property }) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const imageUrls = getPropertyImageUrls(property)
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  if (imageUrls.length === 0) {
    return (
      <div className="property-gallery__empty">
        {isNp ? 'तस्वीर उपलब्ध छैन' : 'No property images available'}
      </div>
    )
  }

  const activeIndex = Math.min(activeImageIndex, imageUrls.length - 1)
  const activeUrl = imageUrls[activeIndex]

  return (
    <div className="property-gallery">
      <div className="property-gallery__main-wrap">
        <img
          src={optimizedImageUrl(activeUrl, 1280)}
          srcSet={optimizedSrcSet(activeUrl, [640, 960, 1280, 1600])}
          sizes="(min-width: 992px) 66vw, 100vw"
          alt={`${property.title} — ${isNp ? 'तस्वीर' : 'photo'} ${activeIndex + 1} / ${imageUrls.length}`}
          className="property-gallery__main"
        />
        {imageUrls.length > 1 ? (
          <span className="property-gallery__counter" aria-hidden="true">
            {activeIndex + 1} / {imageUrls.length}
          </span>
        ) : null}
      </div>
      {imageUrls.length > 1 ? (
        <div className="property-gallery__thumbs" role="group" aria-label={isNp ? 'तस्वीरहरू' : 'Photos'}>
          {imageUrls.map((imageUrl, index) => (
            <button
              key={imageUrl}
              type="button"
              className={`property-gallery__thumb-btn ${index === activeIndex ? 'is-active' : ''}`}
              onClick={() => setActiveImageIndex(index)}
              aria-label={`${isNp ? 'तस्वीर' : 'Show photo'} ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <img src={optimizedImageUrl(imageUrl, 200)} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
