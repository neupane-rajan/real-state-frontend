import { useQuery } from '@tanstack/react-query'
import { Col, Container, Row } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import axios from 'axios'
import {
  formatNprPrice,
  getLowestAvailablePlotPrice,
  getProperties,
  getPropertyAmenities,
  getPropertyById,
  getPropertyImageUrls,
  isPlotProject,
  type Property,
} from '../../api/properties'
import { PlotProjectSection } from '../../components/plots/PlotProjectSection'
import { PropertyCard } from '../../components/property/PropertyCard'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { InquiryForm } from '../../components/common/InquiryForm'
import { CheckIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '../../components/common/Icons'
import { PropertyGallery } from '../../components/property/PropertyGallery'
import { usePropertyFacts } from '../../hooks/usePropertyFacts'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getPropertyWhatsAppMessage, getWhatsAppUrl } from '../../utils/contact'
import { optimizedImageUrl } from '../../utils/images'
import { translateAmenity, translateCategory, translateStatus } from '../../utils/translateHelpers'

// schema.org structured data so search engines understand the listing.
function PropertyStructuredData({ property }: { property: Property }) {
  const image = getPropertyImageUrls(property)[0]
  const data = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: window.location.href,
    datePosted: property.createdAt,
    ...(image ? { image: optimizedImageUrl(image, 1200) } : {}),
    address: property.address,
    ...(property.price
      ? { offers: { '@type': 'Offer', price: property.price, priceCurrency: 'NPR' } }
      : {}),
    provider: {
      '@type': 'RealEstateAgent',
      name: companyInfo.nameEn,
      telephone: `+977${companyInfo.phones[0]}`,
      email: companyInfo.email,
    },
  }

  return (
    <script
      type="application/ld+json"
      // JSON.stringify output with "<" escaped cannot break out of the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

export function PropertyDetail() {
  const { propertyId } = useParams()
  const { language } = useLanguage()
  const isNp = language === 'np'

  const {
    data: property,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => getPropertyById(propertyId ?? ''),
    enabled: Boolean(propertyId),
    retry: (count, queryError) =>
      !(axios.isAxiosError(queryError) && queryError.response?.status === 404) && count < 1,
  })

  // Shares the listing page's cached query, so returning visitors don't refetch.
  const allPropertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(),
    enabled: Boolean(property),
  })
  const similar = property
    ? (allPropertiesQuery.data ?? [])
        .filter((item) => item.id !== property.id && item.category?.id === property.category?.id)
        .slice(0, 3)
    : []

  const cover = property ? getPropertyImageUrls(property)[0] : undefined
  usePageMeta({
    title: property?.title ?? (isNp ? 'सम्पत्ति विवरण' : 'Property details'),
    description: property ? `${property.address} — ${property.description}` : undefined,
    image: cover ? optimizedImageUrl(cover, 1200) : undefined,
  })

  const facts = usePropertyFacts(property ?? ({} as Property))

  if (isLoading) {
    return (
      <Container className="py-5">
        <Loader label={isNp ? 'विवरण लोड हुँदैछ…' : 'Loading property details…'} />
      </Container>
    )
  }

  if (isError || !property) {
    const notFound = axios.isAxiosError(error) && error.response?.status === 404
    return (
      <Container className="py-5">
        <ErrorState
          title={
            notFound
              ? isNp ? 'सम्पत्ति फेला परेन' : 'Property not found'
              : isNp ? 'विवरण लोड गर्न सकिएन' : 'Could not load this property'
          }
          message={
            notFound
              ? isNp ? 'यो सम्पत्ति हटाइएको वा उपलब्ध नभएको हुन सक्छ।' : 'This listing may have been removed or is no longer available.'
              : isNp ? 'कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।' : 'Please refresh the page or try again shortly.'
          }
        />
        <div className="text-center mt-4">
          <Link to="/properties" className="btn btn-outline-primary">
            {isNp ? 'सबै सम्पत्ति हेर्नुहोस्' : 'Browse all properties'}
          </Link>
        </div>
      </Container>
    )
  }

  const price = formatNprPrice(property.price)
  const plotProject = isPlotProject(property)
  // Plot projects without an overall price show the lowest available plot price instead.
  const lowestPlotPrice = plotProject && !price ? formatNprPrice(getLowestAvailablePlotPrice(property.plots)) : null
  const amenities = getPropertyAmenities(property)
  const categoryName = translateCategory(property.category?.name, language)
  const statusName = translateStatus(property.status?.name, language)
  const pageUrl = window.location.href
  const whatsappUrl = getWhatsAppUrl(getPropertyWhatsAppMessage(property.title, pageUrl, isNp))
  const inquiryMessage = isNp
    ? `नमस्ते, मलाई "${property.title}" सम्पत्तिमा रुचि छ। कृपया थप जानकारी दिनुहोला।`
    : `Hello, I am interested in the property "${property.title}". Could you provide more information?`

  return (
    <div className="pd-page">
      <PropertyStructuredData property={property} />
      <Container className="pd-container">
        <nav aria-label={isNp ? 'ब्रेडक्रम' : 'Breadcrumb'} className="pd-breadcrumb">
          <ol>
            <li><Link to="/">{isNp ? 'होम' : 'Home'}</Link></li>
            <li><Link to="/properties">{isNp ? 'सम्पत्ति' : 'Properties'}</Link></li>
            <li aria-current="page">{property.title}</li>
          </ol>
        </nav>

        <Row className="g-4 g-xl-5">
          <Col lg={8}>
            <PropertyGallery property={property} />

            <header className="pd-header">
              <div className="pd-header__badges">
                {categoryName ? <span className="badge-pill badge-pill--soft">{categoryName}</span> : null}
                {statusName ? <span className="badge-pill badge-pill--status">{statusName}</span> : null}
                {property.isFeatured ? <span className="badge-pill badge-pill--featured">{isNp ? 'विशेष' : 'Featured'}</span> : null}
              </div>
              <h1 className="pd-header__title">{property.title}</h1>
              {property.address ? (
                <p className="pd-header__location">
                  <MapPinIcon size={18} />
                  <span>{property.address}</span>
                </p>
              ) : null}
              {price ? (
                <p className="pd-header__price">
                  <span className="visually-hidden">{isNp ? 'मूल्य: ' : 'Price: '}</span>
                  {price}
                </p>
              ) : lowestPlotPrice ? (
                <p className="pd-header__price">
                  <small className="pd-header__price-prefix">{isNp ? 'प्लट सुरु मूल्य' : 'Plots from'}</small> {lowestPlotPrice}
                </p>
              ) : null}
            </header>

            {facts.length > 0 ? (
              <section className="pd-section" aria-labelledby="pd-facts-heading">
                <h2 id="pd-facts-heading" className="pd-section__title">{isNp ? 'मुख्य विवरण' : 'Key facts'}</h2>
                <dl className="pd-facts">
                  {facts.map((fact) => (
                    <div key={fact.key} className="pd-facts__item">
                      <span className="pd-facts__icon">{fact.icon}</span>
                      <dt>{fact.label}</dt>
                      <dd>{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            {property.description ? (
              <section className="pd-section" aria-labelledby="pd-desc-heading">
                <h2 id="pd-desc-heading" className="pd-section__title">{isNp ? 'विवरण' : 'Description'}</h2>
                <p className="pd-section__text">{property.description}</p>
              </section>
            ) : null}

            {/* Land development projects only: site plan, plot layout, list and plot details */}
            {plotProject ? <PlotProjectSection property={property} /> : null}

            {amenities.length > 0 ? (
              <section className="pd-section" aria-labelledby="pd-amenities-heading">
                <h2 id="pd-amenities-heading" className="pd-section__title">{isNp ? 'सुविधाहरू' : 'Amenities & features'}</h2>
                <ul className="pd-amenities">
                  {amenities.map((amenity) => (
                    <li key={amenity.id}>
                      <CheckIcon className="text-success" />
                      <span>{translateAmenity(amenity.name, language)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {property.locationLink || property.videos.length > 0 || property.documents.length > 0 ? (
              <section className="pd-section" aria-labelledby="pd-more-heading">
                <h2 id="pd-more-heading" className="pd-section__title">{isNp ? 'थप जानकारी' : 'Additional information'}</h2>
                {property.videos.map((video) => (
                  <video key={video.id} className="pd-video" src={video.video_url} controls preload="metadata" />
                ))}
                <div className="pd-links">
                  {property.locationLink ? (
                    <a href={property.locationLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
                      <MapPinIcon />
                      <span>{isNp ? 'गुगल म्याप्समा हेर्नुहोस्' : 'View on Google Maps'}</span>
                    </a>
                  ) : null}
                  {property.documents.map((doc) => (
                    <a key={doc.id} href={doc.doc_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary">
                      {doc.doc_name}
                    </a>
                  ))}
                </div>
              </section>
            ) : null}
          </Col>

          <Col lg={4}>
            <aside className="pd-contact-card" aria-labelledby="pd-contact-heading">
              <h2 id="pd-contact-heading" className="pd-contact-card__title">
                {isNp ? 'यस सम्पत्तिबारे सोध्नुहोस्' : 'Interested in this property?'}
              </h2>
              <p className="pd-contact-card__text">
                {price
                  ? isNp ? 'भ्रमण वा थप जानकारीका लागि हामीलाई सम्पर्क गर्नुहोस्।' : 'Contact us to arrange a visit or get more details.'
                  : isNp ? 'मूल्य र थप जानकारीका लागि हामीलाई सम्पर्क गर्नुहोस्।' : 'Contact us for the price and more details.'}
              </p>
              <div className="pd-contact-card__actions">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <WhatsAppIcon />
                  <span>{isNp ? 'व्हाट्सएपमा सोध्नुहोस्' : 'Ask on WhatsApp'}</span>
                </a>
                <a href={getPhoneHref()} className="btn btn-outline-primary">
                  <PhoneIcon />
                  <span>{isNp ? 'फोन गर्नुहोस्' : 'Call'} {companyInfo.phones[0]}</span>
                </a>
              </div>
              <div className="pd-contact-card__divider">
                <span>{isNp ? 'वा सन्देश पठाउनुहोस्' : 'or send an inquiry'}</span>
              </div>
              <InquiryForm propertyId={property.id} defaultMessage={inquiryMessage} compact />
            </aside>
          </Col>
        </Row>

        {similar.length > 0 ? (
          <section className="pd-similar" aria-labelledby="pd-similar-heading">
            <div className="home-section-header">
              <h2 id="pd-similar-heading">{isNp ? 'यस्तै अन्य सम्पत्ति' : 'Similar properties'}</h2>
              <Link to={`/properties?type=${encodeURIComponent(property.category?.name ?? '')}`} className="home-section-header__link">
                {isNp ? 'सबै हेर्नुहोस्' : 'View all'} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <Row xs={1} md={2} lg={3} className="g-4">
              {similar.map((item) => (
                <Col key={item.id}>
                  <PropertyCard property={item} />
                </Col>
              ))}
            </Row>
          </section>
        ) : null}
      </Container>

      {/* Phones: keep the two main actions in reach while scrolling */}
      <div className="pd-mobile-bar">
        <a href={getPhoneHref()} className="btn btn-primary">
          <PhoneIcon />
          <span>{isNp ? 'फोन' : 'Call'}</span>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  )
}
