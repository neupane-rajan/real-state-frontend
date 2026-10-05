import { useMemo, useState } from 'react'
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
import { SectionNav } from '../../components/property/SectionNav'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { InquiryForm } from '../../components/common/InquiryForm'
import {
  CalendarIcon,
  CheckIcon,
  HomeIcon,
  MapPinIcon,
  PhoneIcon,
  ShareIcon,
  TagIcon,
  WhatsAppIcon,
} from '../../components/common/Icons'
import { PropertyGallery } from '../../components/property/PropertyGallery'
import { usePropertyFacts, type PropertyFact } from '../../hooks/usePropertyFacts'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getPropertyWhatsAppMessage, getWhatsAppUrl } from '../../utils/contact'
import { optimizedImageUrl } from '../../utils/images'
import { translateAmenity, translateCategory, translateStatus } from '../../utils/translateHelpers'
import { formatDate } from '../../utils/nepali'
import { localizeProperty } from '../../utils/localize'
import { AutoText } from '../../components/common/AutoText'

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

// Short reference code shown to visitors and quoted in messages, e.g. BR-0063.
const listingCode = (id: number) => `BR-${String(id).padStart(4, '0')}`

export function PropertyDetail() {
  const { propertyId } = useParams()
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [inquiryMode, setInquiryMode] = useState<'info' | 'visit'>('info')
  const [shareStatus, setShareStatus] = useState<string | null>(null)

  const {
    data: rawProperty,
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

  const property = rawProperty ? localizeProperty(rawProperty, isNp) : rawProperty

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
  const plotProject = property ? isPlotProject(property) : false
  const amenities = property ? getPropertyAmenities(property) : []
  const descriptionLines = (property?.description ?? '').split('\n').map((line) => line.trim()).filter(Boolean)

  const sections = useMemo(
    () =>
      [
        { id: 'overview', label: isNp ? 'मुख्य विवरण' : 'Overview' },
        descriptionLines.length > 0 ? { id: 'description', label: isNp ? 'विवरण' : 'Description' } : null,
        plotProject ? { id: 'plots', label: isNp ? 'प्लटहरू' : 'Plots' } : null,
        amenities.length > 0 ? { id: 'amenities', label: isNp ? 'सुविधाहरू' : 'Amenities' } : null,
        { id: 'location', label: isNp ? 'लोकेसन' : 'Location' },
      ].filter((section): section is { id: string; label: string } => section !== null),
    [isNp, descriptionLines.length, plotProject, amenities.length],
  )

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

  const code = listingCode(property.id)
  const price = formatNprPrice(property.price, isNp)
  // Plot projects without an overall price show the lowest available plot price instead.
  const lowestPlotPrice = plotProject && !price ? formatNprPrice(getLowestAvailablePlotPrice(property.plots), isNp) : null
  const categoryName = translateCategory(property.category?.name, language)
  const statusName = translateStatus(property.status?.name, language)
  const listedOn = formatDate(property.createdAt, isNp, 'short')
  const pageUrl = window.location.href
  const whatsappUrl = getWhatsAppUrl(getPropertyWhatsAppMessage(`${property.title} [${code}]`, pageUrl, isNp))

  const inquiryMessage =
    inquiryMode === 'visit'
      ? isNp
        ? `नमस्ते, म "${property.title}" [${code}] हेर्न साइट भ्रमण गर्न चाहन्छु। कृपया उपयुक्त समय जानकारी दिनुहोला।`
        : `Hello, I would like to book a site visit for "${property.title}" [${code}]. Please let me know a suitable time.`
      : isNp
        ? `नमस्ते, मलाई "${property.title}" [${code}] सम्पत्तिमा रुचि छ। कृपया थप जानकारी दिनुहोला।`
        : `Hello, I am interested in "${property.title}" [${code}]. Could you provide more information?`

  const overviewFacts: PropertyFact[] = [
    { key: 'type', icon: <HomeIcon />, label: isNp ? 'प्रकार' : 'Property type', value: categoryName },
    ...(statusName ? [{ key: 'status', icon: <CheckIcon />, label: isNp ? 'स्थिति' : 'Status', value: statusName }] : []),
    ...facts,
    { key: 'code', icon: <TagIcon />, label: isNp ? 'सम्पत्ति कोड' : 'Listing code', value: code },
  ]

  const bookSiteVisit = () => {
    setInquiryMode('visit')
    document.getElementById('pd-enquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => document.getElementById(`inquiry-${property.id}-name`)?.focus({ preventScroll: true }), 450)
  }

  const share = async () => {
    const shareData = { title: property.title, text: `${property.title} — ${property.address}`, url: pageUrl }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(pageUrl)
        setShareStatus(isNp ? 'लिङ्क कपी भयो' : 'Link copied')
        window.setTimeout(() => setShareStatus(null), 2500)
      }
    } catch {
      // Share sheet dismissed or clipboard blocked; nothing to do.
    }
  }

  // English address: map search works best with it
  const mapQuery = encodeURIComponent(`${rawProperty?.address ?? property.address}, Nepal`)

  return (
    <div className="pd-page">
      <PropertyStructuredData property={property} />
      <Container className="pd-container">
        <nav aria-label={isNp ? 'ब्रेडक्रम' : 'Breadcrumb'} className="pd-breadcrumb">
          <ol>
            <li><Link to="/">{isNp ? 'होम' : 'Home'}</Link></li>
            <li><Link to="/properties">{isNp ? 'सम्पत्ति' : 'Properties'}</Link></li>
            <li aria-current="page"><AutoText>{property.title}</AutoText></li>
          </ol>
        </nav>

        <Row className="g-4">
          <Col lg={8}>
            <section className="pd-card pd-summary" aria-labelledby="pd-title">
              <header className="pd-summary__head">
                <div className="pd-summary__main">
                  <h1 id="pd-title" className="pd-summary__title"><AutoText>{property.title}</AutoText></h1>
                  {property.address ? (
                    <p className="pd-summary__location">
                      <MapPinIcon size={16} />
                      <AutoText>{property.address}</AutoText>
                    </p>
                  ) : null}
                  <div className="pd-summary__tags">
                    <span className="pd-tag">#{code}</span>
                    {categoryName ? <span className="pd-tag">{categoryName}</span> : null}
                    {statusName ? <span className={`pd-tag ${property.status?.name === 'Sold' ? 'pd-tag--sold' : 'pd-tag--status'}`}>{statusName}</span> : null}
                    {property.isFeatured ? <span className="pd-tag pd-tag--featured">{isNp ? 'विशेष' : 'Featured'}</span> : null}
                  </div>
                </div>
                <div className="pd-summary__side">
                  {price ? (
                    <p className="pd-price">
                      <span className="visually-hidden">{isNp ? 'मूल्य: ' : 'Price: '}</span>
                      {price}
                    </p>
                  ) : lowestPlotPrice ? (
                    <p className="pd-price">
                      <small>{isNp ? 'प्लट सुरु मूल्य' : 'Plots from'}</small>
                      {lowestPlotPrice}
                    </p>
                  ) : (
                    <p className="pd-price pd-price--ask">{isNp ? 'मूल्यका लागि सम्पर्क गर्नुहोस्' : 'Price on request'}</p>
                  )}
                  <p className="pd-summary__date">
                    <CalendarIcon size={14} />
                    {isNp ? 'सूचीकृत' : 'Listed'} {listedOn}
                  </p>
                </div>
              </header>
              <PropertyGallery property={property} />
            </section>

            <SectionNav sections={sections} label={isNp ? 'यस पृष्ठका खण्डहरू' : 'Sections on this page'} />

            <section id="overview" className="pd-card pd-anchor" aria-labelledby="pd-overview-heading">
              <h2 id="pd-overview-heading" className="pd-card__title">{isNp ? 'मुख्य विवरण' : 'Overview'}</h2>
              <dl className="pd-overview">
                {overviewFacts.map((fact) => (
                  <div key={fact.key} className="pd-overview__item">
                    <span className="pd-overview__icon">{fact.icon}</span>
                    <dt>{fact.label}</dt>
                    <dd>{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {descriptionLines.length > 0 ? (
              <section id="description" className="pd-card pd-anchor" aria-labelledby="pd-desc-heading">
                <h2 id="pd-desc-heading" className="pd-card__title">{isNp ? 'विवरण' : 'Description'}</h2>
                {descriptionLines.length > 1 ? (
                  <ul className="pd-description-list">
                    {descriptionLines.map((line, i) => <AutoText as="li" key={i}>{line}</AutoText>)}
                  </ul>
                ) : (
                  <AutoText as="p" className="pd-section__text mb-0">{descriptionLines[0]}</AutoText>
                )}
              </section>
            ) : null}

            {/* Land development projects only: site plan, plot availability, list and plot details */}
            {plotProject ? <PlotProjectSection property={property} /> : null}

            {amenities.length > 0 ? (
              <section id="amenities" className="pd-card pd-anchor" aria-labelledby="pd-amenities-heading">
                <h2 id="pd-amenities-heading" className="pd-card__title">{isNp ? 'सुविधाहरू' : 'Amenities & features'}</h2>
                <ul className="pd-amenities">
                  {amenities.map((amenity) => (
                    <li key={amenity.id}>
                      <span className="pd-amenities__check"><CheckIcon size={14} /></span>
                      <span>{translateAmenity(amenity.name, language)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section id="location" className="pd-card pd-anchor" aria-labelledby="pd-location-heading">
              <div className="pd-card__head">
                <h2 id="pd-location-heading" className="pd-card__title mb-0">{isNp ? 'लोकेसन' : 'Location'}</h2>
                {property.locationLink ? (
                  <a href={property.locationLink} target="_blank" rel="noopener noreferrer" className="home-section-header__link">
                    {isNp ? 'गुगल म्याप्समा खोल्नुहोस्' : 'Open in Google Maps'} <span aria-hidden="true">↗</span>
                  </a>
                ) : null}
              </div>
              <p className="pd-summary__location mb-3">
                <MapPinIcon size={16} />
                <AutoText>{property.address}</AutoText>
              </p>
              <div className="pd-map">
                <iframe
                  title={isNp ? 'सम्पत्तिको लोकेसन नक्सा' : 'Property location map'}
                  src={`https://maps.google.com/maps?q=${mapQuery}&z=14&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="pd-map__note">
                {isNp ? 'नक्सा अनुमानित क्षेत्र देखाउँछ। ठ्याक्कै स्थानका लागि साइट भ्रमण मिलाउनुहोस्।' : 'The map shows the approximate area. Book a site visit for the exact location.'}
              </p>

              {property.videos.length > 0 || property.documents.length > 0 ? (
                <div className="pd-media-extra">
                  {property.videos.map((video) => (
                    <video key={video.id} className="pd-video" src={video.video_url} controls preload="metadata" />
                  ))}
                  <div className="pd-links">
                    {property.documents.map((doc) => (
                      <a key={doc.id} href={doc.doc_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm">
                        {doc.doc_name}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          </Col>

          <Col lg={4}>
            <div className="pd-sidebar">
              <section className="pd-card pd-agent" aria-labelledby="pd-agent-heading">
                <div className="pd-agent__head">
                  <img src="/logo-small.webp" alt="" width={52} height={52} />
                  <div>
                    <h2 id="pd-agent-heading" className="pd-agent__name">{isNp ? companyInfo.nameNp : companyInfo.nameEn}</h2>
                    <p className="pd-agent__meta">{isNp ? '१० वर्षदेखि कैलालीमा' : 'Local agency · 10+ years in Kailali'}</p>
                  </div>
                </div>
                <div className="pd-agent__actions">
                  <a href={getPhoneHref()} className="btn btn-outline-primary">
                    <PhoneIcon />
                    <span>{isNp ? 'फोन गर्नुहोस्' : 'Call'}</span>
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                    <WhatsAppIcon />
                    <span>WhatsApp</span>
                  </a>
                </div>
                <button type="button" className="btn btn-outline-secondary w-100 mt-2" onClick={bookSiteVisit}>
                  <CalendarIcon />
                  <span>{isNp ? 'साइट भ्रमण बुक गर्नुहोस्' : 'Book a site visit'}</span>
                </button>
                <p className="pd-agent__phone">
                  {isNp ? 'फोन' : 'Phone'}: <a href={getPhoneHref()}>{companyInfo.phones[0]}</a>
                </p>
              </section>

              <section id="pd-enquiry" className="pd-card pd-enquiry" aria-labelledby="pd-enquiry-heading">
                <h2 id="pd-enquiry-heading" className="pd-card__title">
                  {inquiryMode === 'visit'
                    ? isNp ? 'साइट भ्रमण अनुरोध' : 'Request a site visit'
                    : isNp ? 'जानकारी माग्नुहोस्' : 'Enquiry form'}
                </h2>
                <InquiryForm key={inquiryMode} propertyId={property.id} defaultMessage={inquiryMessage} compact />
              </section>

              <div className="pd-share">
                <button type="button" className="btn btn-link" onClick={share}>
                  <ShareIcon />
                  <span>{isNp ? 'साथीसँग सेयर गर्नुहोस्' : 'Share with friends'}</span>
                </button>
                <span className="pd-share__status" aria-live="polite">{shareStatus}</span>
              </div>
            </div>
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
