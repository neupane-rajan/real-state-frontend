import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Col, Container, Form, Row } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { getLowestAvailablePlotPrice, getProperties, getPropertyMeta, type Property } from '../../api/properties'
import { EmptyState } from '../../components/common/EmptyState'
import { PageHeader } from '../../components/common/PageHeader'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { PropertyCard } from '../../components/property/PropertyCard'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { translateCategory, translateStatus } from '../../utils/translateHelpers'
import { localDigits, toNepaliDigits } from '../../utils/nepali'

type SortOption = 'newest' | 'price-asc' | 'price-desc'

const LAKH = 100000

// Budget ranges in NPR; "ask" = listings without a price.
const BUDGETS: Record<string, { min: number; max: number } | 'ask'> = {
  u50: { min: 0, max: 50 * LAKH },
  '50-100': { min: 50 * LAKH, max: 100 * LAKH },
  '100-200': { min: 100 * LAKH, max: 200 * LAKH },
  '200+': { min: 200 * LAKH, max: Infinity },
  ask: 'ask',
}

// The price used for filtering/sorting: own price, or the cheapest available plot for plot projects.
const effectivePrice = (property: Property) =>
  property.price && property.price > 0 ? property.price : getLowestAvailablePlotPrice(property.plots)

// Properties without a price always sort after priced ones.
const comparePrice = (a: Property, b: Property, direction: 1 | -1) => {
  const priceA = effectivePrice(a)
  const priceB = effectivePrice(b)
  if (priceA === null && priceB === null) return 0
  if (priceA === null) return 1
  if (priceB === null) return -1
  return (priceA - priceB) * direction
}

export function PropertyList() {
  const { t, language } = useLanguage()
  const isNp = language === 'np'
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('q') ?? ''
  const category = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const sort = (searchParams.get('sort') as SortOption | null) ?? 'newest'
  const budget = searchParams.get('budget') ?? ''
  const minBeds = Number(searchParams.get('beds') ?? 0)
  const view = searchParams.get('view') === 'list' ? 'list' : 'grid'

  usePageMeta({
    title: isNp ? 'सम्पत्ति सूची' : 'Properties for sale',
    description: isNp
      ? 'कैलाली र सुदूरपश्चिममा घर, जग्गा, फ्ल्याट र व्यावसायिक सम्पत्तिहरू खोज्नुहोस्।'
      : 'Browse houses, land and plot projects in Kailali and Sudurpashchim.',
  })

  const propertiesQuery = useQuery({
    queryKey: ['properties'],
    queryFn: () => getProperties(),
  })
  const metaQuery = useQuery({
    queryKey: ['property-meta'],
    queryFn: getPropertyMeta,
    staleTime: 10 * 60 * 1000,
  })

  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data])

  const updateParam = (key: string, value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = properties.filter((property) => {
      if (category && property.category?.name !== category) return false
      if (status && property.status?.name !== status) return false
      if (minBeds && (property.bedrooms ?? 0) < minBeds) return false
      const range = BUDGETS[budget]
      if (range) {
        const price = effectivePrice(property)
        if (range === 'ask' ? price !== null : price === null || price < range.min || price >= range.max) return false
      }
      if (!query) return true
      return [property.title, property.address, property.description]
        .some((field) => field?.toLowerCase().includes(query))
    })

    if (sort === 'price-asc') result.sort((a, b) => comparePrice(a, b, 1))
    if (sort === 'price-desc') result.sort((a, b) => comparePrice(a, b, -1))

    return result
  }, [properties, search, category, status, sort, budget, minBeds])

  // Quick type filters: only types that currently have listings, with counts.
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    properties.forEach((property) => {
      const name = property.category?.name
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [properties])

  const activeFilterCount = [search, category, status, budget, minBeds ? 'beds' : '', sort !== 'newest' ? sort : ''].filter(Boolean).length
  const clearFilters = () => setSearchParams(view === 'list' ? { view: 'list' } : {}, { replace: true })

  return (
    <div className="property-listing-page">
      <PageHeader
        title={t('featuredProperties')}
        subtitle={isNp ? 'घर, जग्गा र प्लटिङ परियोजनाहरू खोज्नुहोस्।' : 'Browse houses, land and plot projects from a trusted local team.'}
        crumbs={[{ label: isNp ? 'सम्पत्ति' : 'Properties' }]}
      >
        <Form.Group controlId="prop-search" className="page-hero__search">
          <Form.Label className="visually-hidden">{isNp ? 'खोज्नुहोस्' : 'Search properties'}</Form.Label>
          <Form.Control
            type="search"
            placeholder={isNp ? 'शीर्षक वा स्थान खोज्नुहोस्, जस्तै: धनगढी' : 'Search by title or location, e.g. Dhangadhi'}
            value={search}
            onChange={(event) => updateParam('q', event.target.value)}
          />
        </Form.Group>
      </PageHeader>

      <section className="section-block section-block--tight">
        <Container>
          <form className="pf-bar" role="search" onSubmit={(event) => event.preventDefault()}>
            <Form.Group controlId="prop-category">
              <Form.Label className="visually-hidden">{isNp ? 'प्रकार' : 'Property type'}</Form.Label>
              <Form.Select value={category} onChange={(event) => updateParam('type', event.target.value)}>
                <option value="">{isNp ? 'सबै प्रकार' : 'All types'}</option>
                {(metaQuery.data?.categories ?? []).map((item) => (
                  <option key={item.id} value={item.name}>{translateCategory(item.name, language)}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="prop-status">
              <Form.Label className="visually-hidden">{isNp ? 'स्थिति' : 'Status'}</Form.Label>
              <Form.Select value={status} onChange={(event) => updateParam('status', event.target.value)}>
                <option value="">{isNp ? 'सबै स्थिति' : 'Any status'}</option>
                {(metaQuery.data?.statuses ?? []).map((item) => (
                  <option key={item.id} value={item.name}>{translateStatus(item.name, language)}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="prop-budget">
              <Form.Label className="visually-hidden">{isNp ? 'बजेट' : 'Budget'}</Form.Label>
              <Form.Select value={budget} onChange={(event) => updateParam('budget', event.target.value)}>
                <option value="">{isNp ? 'जुनसुकै बजेट' : 'Any budget'}</option>
                <option value="u50">{isNp ? '५० लाखभन्दा कम' : 'Under 50 Lakh'}</option>
                <option value="50-100">{isNp ? '५० लाख – १ करोड' : '50 Lakh – 1 Cr'}</option>
                <option value="100-200">{isNp ? '१ – २ करोड' : '1 – 2 Cr'}</option>
                <option value="200+">{isNp ? '२ करोडभन्दा बढी' : 'Above 2 Cr'}</option>
                <option value="ask">{isNp ? 'मूल्य सोध्नुपर्ने' : 'Price on request'}</option>
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="prop-beds">
              <Form.Label className="visually-hidden">{isNp ? 'शयनकक्ष' : 'Bedrooms'}</Form.Label>
              <Form.Select value={minBeds ? String(minBeds) : ''} onChange={(event) => updateParam('beds', event.target.value)}>
                <option value="">{isNp ? 'शयनकक्ष: जुनसुकै' : 'Any bedrooms'}</option>
                {[1, 2, 3, 4].map((beds) => (
                  <option key={beds} value={beds}>{isNp ? `${localDigits(beds, true)}+ शयनकक्ष` : `${beds}+ bedrooms`}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group controlId="prop-sort">
              <Form.Label className="visually-hidden">{isNp ? 'क्रम' : 'Sort by'}</Form.Label>
              <Form.Select value={sort} onChange={(event) => updateParam('sort', event.target.value === 'newest' ? '' : event.target.value)}>
                <option value="newest">{isNp ? 'नयाँ पहिले' : 'Newest first'}</option>
                <option value="price-asc">{isNp ? 'मूल्य: कम → बढी' : 'Price: low to high'}</option>
                <option value="price-desc">{isNp ? 'मूल्य: बढी → कम' : 'Price: high to low'}</option>
              </Form.Select>
            </Form.Group>

            {activeFilterCount > 0 ? (
              <button type="button" onClick={clearFilters} className="btn btn-link pf-bar__clear">
                {isNp ? 'फिल्टर हटाउनुहोस्' : 'Clear filters'}
              </button>
            ) : null}
          </form>

          {typeCounts.length > 1 ? (
            <div className="pf-chips" role="group" aria-label={isNp ? 'प्रकार अनुसार' : 'Filter by type'}>
              <button
                type="button"
                className={`pf-chip ${category === '' ? 'is-active' : ''}`}
                aria-pressed={category === ''}
                onClick={() => updateParam('type', '')}
              >
                {isNp ? 'सबै' : 'All'} <span>{localDigits(properties.length, isNp)}</span>
              </button>
              {typeCounts.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  className={`pf-chip ${category === name ? 'is-active' : ''}`}
                  aria-pressed={category === name}
                  onClick={() => updateParam('type', category === name ? '' : name)}
                >
                  {translateCategory(name, language)} <span>{localDigits(count, isNp)}</span>
                </button>
              ))}
            </div>
          ) : null}

          <h2 className="visually-hidden">{isNp ? 'नतिजाहरू' : 'Results'}</h2>

          {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length > 0 ? (
            <div className="pf-results">
              <p aria-live="polite">
                {isNp
                  ? toNepaliDigits(`${properties.length} मध्ये ${filtered.length} सम्पत्ति देखाइँदै`)
                  : `Showing ${filtered.length} of ${properties.length} properties`}
              </p>
              <div className="plot-view-toggle" role="group" aria-label={isNp ? 'देखाउने तरिका' : 'Layout'}>
                <button type="button" className={view === 'grid' ? 'is-active' : ''} aria-pressed={view === 'grid'} onClick={() => updateParam('view', '')}>
                  {isNp ? 'ग्रिड' : 'Grid'}
                </button>
                <button type="button" className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'} onClick={() => updateParam('view', 'list')}>
                  {isNp ? 'सूची' : 'List'}
                </button>
              </div>
            </div>
          ) : null}

          {propertiesQuery.isLoading ? <Loader label={isNp ? 'सम्पत्तिहरू लोड हुँदैछ…' : 'Loading properties…'} /> : null}
          {propertiesQuery.isError ? (
            <ErrorState
              title={isNp ? 'सम्पत्तिहरू लोड गर्न सकिएन' : 'Could not load properties'}
              message={isNp ? 'कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।' : 'Please refresh the page or try again shortly.'}
            />
          ) : null}

          {!propertiesQuery.isLoading && !propertiesQuery.isError && filtered.length === 0 ? (
            <EmptyState
              title={
                activeFilterCount > 0
                  ? isNp ? 'कुनै सम्पत्ति भेटिएन' : 'No properties match your filters'
                  : isNp ? 'हाल कुनै सम्पत्ति उपलब्ध छैन' : 'No properties available at the moment'
              }
              message={
                activeFilterCount > 0
                  ? isNp ? 'फिल्टरहरू बदल्नुहोस् वा हटाउनुहोस्।' : 'Try adjusting or clearing your filters.'
                  : isNp ? 'छिट्टै नयाँ सम्पत्ति थपिनेछ। थप जानकारीका लागि सम्पर्क गर्नुहोस्।' : 'New listings are added regularly. Contact us to tell us what you are looking for.'
              }
            />
          ) : null}

          {!propertiesQuery.isLoading && !propertiesQuery.isError && filtered.length > 0 ? (
            view === 'list' ? (
              <div className="pf-list">
                {filtered.map((property) => <PropertyCard key={property.id} property={property} layout="row" />)}
              </div>
            ) : (
              <Row xs={1} md={2} lg={3} className="g-4">
                {filtered.map((property) => (
                  <Col key={property.id}>
                    <PropertyCard property={property} />
                  </Col>
                ))}
              </Row>
            )
          ) : null}
        </Container>
      </section>
    </div>
  )
}
