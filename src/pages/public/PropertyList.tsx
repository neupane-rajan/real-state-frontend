import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Col, Container, Form, Row } from 'react-bootstrap'
import { useSearchParams } from 'react-router-dom'
import { getProperties, getPropertyMeta, hasPrice, type Property } from '../../api/properties'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { PropertyCard } from '../../components/property/PropertyCard'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { translateCategory, translateStatus } from '../../utils/translateHelpers'

type SortOption = 'newest' | 'price-asc' | 'price-desc'

// Properties without a price always sort after priced ones.
const comparePrice = (a: Property, b: Property, direction: 1 | -1) => {
  if (!hasPrice(a) && !hasPrice(b)) return 0
  if (!hasPrice(a)) return 1
  if (!hasPrice(b)) return -1
  return ((a.price as number) - (b.price as number)) * direction
}

export function PropertyList() {
  const { t, language } = useLanguage()
  const isNp = language === 'np'
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('q') ?? ''
  const category = searchParams.get('type') ?? ''
  const status = searchParams.get('status') ?? ''
  const sort = (searchParams.get('sort') as SortOption | null) ?? 'newest'

  usePageMeta({
    title: isNp ? 'सम्पत्ति सूची' : 'Properties for sale',
    description: isNp
      ? 'कैलाली र सुदूरपश्चिममा घर, जग्गा, फ्ल्याट र व्यावसायिक सम्पत्तिहरू खोज्नुहोस्।'
      : 'Browse houses, land, flats and commercial properties in Kailali and Sudurpashchim.',
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
      if (!query) return true
      return [property.title, property.address, property.description]
        .some((field) => field?.toLowerCase().includes(query))
    })

    if (sort === 'price-asc') result.sort((a, b) => comparePrice(a, b, 1))
    if (sort === 'price-desc') result.sort((a, b) => comparePrice(a, b, -1))

    return result
  }, [properties, search, category, status, sort])

  // Quick type filters: only types that currently have listings, with counts.
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>()
    properties.forEach((property) => {
      const name = property.category?.name
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
    })
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [properties])

  const activeFilterCount = [search, category, status, sort !== 'newest' ? sort : ''].filter(Boolean).length

  return (
    <div className="property-listing-page">
      <section className="page-hero">
        <Container>
          <p className="eyebrow">{isNp ? 'सम्पत्ति सूची' : 'Property listings'}</p>
          <h1 className="page-hero__title">{t('featuredProperties')}</h1>
          <p className="page-hero__subtitle">
            {isNp
              ? 'घर, जग्गा, फ्ल्याट र व्यावसायिक सम्पत्तिहरू खोज्नुहोस्।'
              : 'Browse houses, land, flats, and commercial properties from a trusted local team.'}
          </p>
        </Container>
      </section>

      <section className="section-block section-block--tight">
        <Container>
          <form className="pf-bar" role="search" onSubmit={(event) => event.preventDefault()}>
            <Form.Group controlId="prop-search" className="pf-bar__search">
              <Form.Label className="visually-hidden">{isNp ? 'खोज्नुहोस्' : 'Search properties'}</Form.Label>
              <Form.Control
                type="search"
                placeholder={isNp ? 'शीर्षक वा स्थान खोज्नुहोस्…' : 'Search by title or location…'}
                value={search}
                onChange={(event) => updateParam('q', event.target.value)}
              />
            </Form.Group>

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

            <Form.Group controlId="prop-sort">
              <Form.Label className="visually-hidden">{isNp ? 'क्रम' : 'Sort by'}</Form.Label>
              <Form.Select value={sort} onChange={(event) => updateParam('sort', event.target.value === 'newest' ? '' : event.target.value)}>
                <option value="newest">{isNp ? 'नयाँ पहिले' : 'Newest first'}</option>
                <option value="price-asc">{isNp ? 'मूल्य: कम → बढी' : 'Price: low to high'}</option>
                <option value="price-desc">{isNp ? 'मूल्य: बढी → कम' : 'Price: high to low'}</option>
              </Form.Select>
            </Form.Group>

            {activeFilterCount > 0 ? (
              <button type="button" onClick={() => setSearchParams({}, { replace: true })} className="btn btn-link pf-bar__clear">
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
                {isNp ? 'सबै' : 'All'} <span>{properties.length}</span>
              </button>
              {typeCounts.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  className={`pf-chip ${category === name ? 'is-active' : ''}`}
                  aria-pressed={category === name}
                  onClick={() => updateParam('type', category === name ? '' : name)}
                >
                  {translateCategory(name, language)} <span>{count}</span>
                </button>
              ))}
            </div>
          ) : null}

          <h2 className="visually-hidden">{isNp ? 'नतिजाहरू' : 'Results'}</h2>

          {!propertiesQuery.isLoading && !propertiesQuery.isError && properties.length > 0 ? (
            <p className="pf-results" aria-live="polite">
              {isNp
                ? `${properties.length} मध्ये ${filtered.length} सम्पत्ति देखाइँदै`
                : `Showing ${filtered.length} of ${properties.length} properties`}
            </p>
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
            <Row xs={1} md={2} lg={3} className="g-4">
              {filtered.map((property) => (
                <Col key={property.id}>
                  <PropertyCard property={property} />
                </Col>
              ))}
            </Row>
          ) : null}
        </Container>
      </section>
    </div>
  )
}
