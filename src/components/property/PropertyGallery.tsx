import { useEffect, useRef, useState, type TouchEvent } from 'react'
import { Modal } from 'react-bootstrap'
import { getPropertyImageUrls, type Property } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl, optimizedSrcSet } from '../../utils/images'
import { ChevronLeftIcon, ChevronRightIcon, ExpandIcon } from '../common/Icons'
import { localDigits } from '../../utils/nepali'

const VISIBLE_THUMBS = 4

type GalleryProps = {
  property: Pick<Property, 'title' | 'images'>
}

// Main photo with arrows + thumbnail strip (vertical on desktop), swipe on touch, full-screen viewer.
export function PropertyGallery({ property }: GalleryProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const imageUrls = getPropertyImageUrls(property as Property)
  const [index, setIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const count = imageUrls.length
  const active = Math.min(index, Math.max(count - 1, 0))
  const go = (step: number) => setIndex((current) => (current + step + count) % count)

  // Arrow keys move through photos while the full-screen viewer is open.
  useEffect(() => {
    if (!isFullscreen || count < 2) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % count)
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isFullscreen, count])

  if (count === 0) {
    return (
      <div className="property-gallery__empty">
        {isNp ? 'तस्वीर उपलब्ध छैन' : 'No property images available'}
      </div>
    )
  }

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0].clientX
  }
  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current === null || count < 2) return
    const delta = event.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  const photoLabel = (i: number) => `${isNp ? 'तस्वीर' : 'Photo'} ${localDigits(`${i + 1} / ${count}`, isNp)}`
  const arrows = count > 1 ? (
    <>
      <button type="button" className="gallery-arrow gallery-arrow--prev" onClick={() => go(-1)} aria-label={isNp ? 'अघिल्लो तस्वीर' : 'Previous photo'}>
        <ChevronLeftIcon />
      </button>
      <button type="button" className="gallery-arrow gallery-arrow--next" onClick={() => go(1)} aria-label={isNp ? 'अर्को तस्वीर' : 'Next photo'}>
        <ChevronRightIcon />
      </button>
    </>
  ) : null

  const hiddenCount = Math.max(count - VISIBLE_THUMBS, 0)

  return (
    <div className={`property-gallery ${count > 1 ? 'property-gallery--with-thumbs' : ''}`}>
      <div className="property-gallery__main-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <img
          src={optimizedImageUrl(imageUrls[active], 1280)}
          srcSet={optimizedSrcSet(imageUrls[active], [640, 960, 1280, 1600])}
          sizes="(min-width: 992px) 60vw, 100vw"
          alt={`${property.title} — ${photoLabel(active)}`}
          className="property-gallery__main"
        />
        {arrows}
        <div className="property-gallery__overlay">
          {count > 1 ? <span className="property-gallery__counter" aria-hidden="true">{localDigits(`${active + 1} / ${count}`, isNp)}</span> : <span />}
          <button type="button" className="property-gallery__expand" onClick={() => setIsFullscreen(true)}>
            <ExpandIcon />
            <span>{isNp ? 'ठूलो हेर्नुहोस्' : 'View full screen'}</span>
          </button>
        </div>
      </div>

      {count > 1 ? (
        <div className="property-gallery__thumbs" role="group" aria-label={isNp ? 'तस्वीरहरू' : 'Photos'}>
          {imageUrls.map((url, i) => {
            const isOverflowTile = i === VISIBLE_THUMBS - 1 && hiddenCount > 0
            return (
              <button
                key={url}
                type="button"
                className={`property-gallery__thumb-btn ${i === active ? 'is-active' : ''} ${i >= VISIBLE_THUMBS ? 'is-extra' : ''}`}
                onClick={() => (isOverflowTile ? (setIndex(i), setIsFullscreen(true)) : setIndex(i))}
                aria-label={isOverflowTile ? `${isNp ? 'सबै तस्वीर' : 'All photos'} (${count})` : photoLabel(i)}
                aria-pressed={i === active}
              >
                <img src={optimizedImageUrl(url, 320)} alt="" loading="lazy" decoding="async" />
                {isOverflowTile ? <span className="property-gallery__more">+{hiddenCount + 1}</span> : null}
              </button>
            )
          })}
        </div>
      ) : null}

      <Modal show={isFullscreen} onHide={() => setIsFullscreen(false)} fullscreen className="gallery-lightbox" aria-label={property.title}>
        <Modal.Header closeButton closeVariant="white" closeLabel={isNp ? 'बन्द गर्नुहोस्' : 'Close'}>
          <Modal.Title as="p" className="h6 mb-0 text-white">{photoLabel(active)}</Modal.Title>
        </Modal.Header>
        <Modal.Body onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <img src={optimizedImageUrl(imageUrls[active], 2000)} alt={`${property.title} — ${photoLabel(active)}`} />
          {arrows}
        </Modal.Body>
      </Modal>
    </div>
  )
}
