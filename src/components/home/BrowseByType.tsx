import { useQuery } from '@tanstack/react-query'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getProperties, getPropertyMeta } from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { categoryEmoji, translateCategory } from '../../utils/translateHelpers'

// Property-type tiles with live listing counts, linking to the filtered listings page.
export function BrowseByType() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const metaQuery = useQuery({ queryKey: ['property-meta'], queryFn: getPropertyMeta, staleTime: 10 * 60 * 1000 })
  // Same cached list the properties page uses.
  const propertiesQuery = useQuery({ queryKey: ['properties'], queryFn: () => getProperties() })

  const counts = new Map<string, number>()
  ;(propertiesQuery.data ?? []).forEach((property) => {
    const name = property.category?.name
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1)
  })

  const categories = metaQuery.data?.categories ?? []
  if (categories.length === 0) return null

  // Types with listings first, then the rest.
  const sorted = [...categories].sort((a, b) => (counts.get(b.name) ?? 0) - (counts.get(a.name) ?? 0))

  return (
    <section className="section-block section-block--tight browse-types" aria-labelledby="browse-types-title">
      <Container>
        <div className="home-section-header">
          <div>
            <h2 id="browse-types-title">{isNp ? 'प्रकार अनुसार खोज्नुहोस्' : 'Browse by type'}</h2>
            <p>{isNp ? 'तपाईंलाई चाहिएको सम्पत्तिको प्रकार छान्नुहोस्।' : 'Pick the kind of property you are looking for.'}</p>
          </div>
        </div>
        <ul className="browse-types__grid">
          {sorted.map((category) => {
            const count = counts.get(category.name) ?? 0
            return (
              <li key={category.id}>
                <Link to={`/properties?type=${encodeURIComponent(category.name)}`} className={`type-tile ${count === 0 ? 'is-empty' : ''}`}>
                  <span className="type-tile__icon" aria-hidden="true">{categoryEmoji(category)}</span>
                  <span className="type-tile__name">{translateCategory(category.name, language)}</span>
                  <span className="type-tile__count">
                    {count > 0
                      ? isNp ? `${count} सम्पत्ति` : `${count} ${count === 1 ? 'listing' : 'listings'}`
                      : isNp ? 'छिट्टै आउँदैछ' : 'Coming soon'}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Container>
    </section>
  )
}
