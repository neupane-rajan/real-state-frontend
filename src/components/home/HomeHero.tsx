import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { getBannerImage, type Banner } from '../../api/banners'
import { formatShortPrice, getPropertyImageUrls, getPropertyMeta, type Property } from '../../api/properties'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl } from '../../utils/images'
import { translateCategory } from '../../utils/translateHelpers'
import { MapPinIcon } from '../common/Icons'

type HomeHeroProps = {
  banners: Banner[]
  latestProperty?: Property
}

export function HomeHero({ banners, latestProperty }: HomeHeroProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const navigate = useNavigate()
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')

  const metaQuery = useQuery({
    queryKey: ['property-meta'],
    queryFn: getPropertyMeta,
    staleTime: 10 * 60 * 1000,
  })

  // An admin-uploaded banner replaces the default photo when one exists.
  const bannerImage = banners.map(getBannerImage).find(Boolean)
  const heroImage = bannerImage ? optimizedImageUrl(bannerImage, 1920) : '/home-hero.webp'

  const onSearch = (event: FormEvent) => {
    event.preventDefault()
    const params = new URLSearchParams()
    if (type) params.set('type', type)
    if (location.trim()) params.set('q', location.trim())
    const query = params.toString()
    navigate(`/properties${query ? `?${query}` : ''}`)
  }

  const latestImage = latestProperty ? getPropertyImageUrls(latestProperty)[0] : undefined
  const latestPrice = latestProperty ? formatShortPrice(latestProperty.price, isNp) : null

  const facts = isNp
    ? [
        { value: '१०+ वर्ष', label: 'घर-जग्गा कारोबारमा' },
        { value: 'हजारौं', label: 'सन्तुष्ट ग्राहक' },
        { value: '२ कार्यालय', label: 'पहलमानपुर र धनगढी' },
      ]
    : [
        { value: '10+ years', label: 'in local real estate' },
        { value: 'Thousands', label: 'of satisfied clients' },
        { value: '2 offices', label: 'Pahalmanpur & Dhangadhi' },
      ]

  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <img className="home-hero__bg" src={heroImage} alt="" width={1536} height={1024} />
      <div className="home-hero__shade" aria-hidden="true" />

      <Container className="home-hero__inner">
        <div className="home-hero__content">
          <p className="home-hero__place">
            <MapPinIcon size={15} />
            {isNp ? 'कैलाली, सुदूरपश्चिम प्रदेश' : 'Kailali, Sudurpashchim Province'}
          </p>
          <h1 id="home-hero-title" className="home-hero__title">
            {isNp ? 'कैलालीमा जग्गा वा घर खोज्दै हुनुहुन्छ?' : 'Looking for land or a house in Kailali?'}
          </h1>
          <p className="home-hero__lead">
            {isNp
              ? companyInfo.shortIntroNp
              : 'Land and house sales, plotting and investment advice from a local team you can visit in person.'}
          </p>

          <div className="home-hero__panel">
            <form className="home-search" onSubmit={onSearch} role="search" aria-label={isNp ? 'सम्पत्ति खोज' : 'Property search'}>
              <div className="home-search__field">
                <label htmlFor="home-search-type">{isNp ? 'प्रकार' : 'Type'}</label>
                <select id="home-search-type" value={type} onChange={(event) => setType(event.target.value)}>
                  <option value="">{isNp ? 'सबै प्रकार' : 'Any type'}</option>
                  {(metaQuery.data?.categories ?? []).map((category) => (
                    <option key={category.id} value={category.name}>
                      {translateCategory(category.name, language)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="home-search__field home-search__field--grow">
                <label htmlFor="home-search-location">{isNp ? 'स्थान' : 'Location'}</label>
                <input
                  id="home-search-location"
                  type="text"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder={isNp ? 'जस्तै: धनगढी, अत्तरिया' : 'e.g. Dhangadhi, Attariya'}
                />
              </div>
              <button type="submit" className="btn btn-primary home-search__submit">
                {isNp ? 'खोज्नुहोस्' : 'Search'}
              </button>
            </form>

            <dl className="home-hero__facts">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt>{fact.value}</dt>
                  <dd>{fact.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {latestProperty ? (
          <Link to={`/properties/${latestProperty.id}`} className="home-hero__listing">
            {latestImage ? (
              <img src={optimizedImageUrl(latestImage, 160)} alt="" width={64} height={64} />
            ) : null}
            <span>
              <small>
                {latestProperty.isFeatured
                  ? isNp ? 'विशेष सूची' : 'Featured listing'
                  : isNp ? 'नयाँ सूची' : 'Latest listing'}
              </small>
              <strong>{latestProperty.title}</strong>
              <span>
                {latestProperty.address}
                {latestPrice ? ` · ${latestPrice}` : ''}
              </span>
            </span>
          </Link>
        ) : null}
      </Container>
    </section>
  )
}
