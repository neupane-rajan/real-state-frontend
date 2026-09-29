import type { Property } from '../../api/properties'
import { usePropertyFacts } from '../../hooks/usePropertyFacts'

// Compact icon + value list used on property cards.
export function PropertyFactsInline({ property }: { property: Property }) {
  const facts = usePropertyFacts(property)

  if (facts.length === 0) {
    return null
  }

  return (
    <ul className="property-facts-inline">
      {facts.map((fact) => (
        <li key={fact.key} title={fact.label}>
          {fact.icon}
          <span className="visually-hidden">{fact.label}: </span>
          <span>{fact.value}</span>
        </li>
      ))}
    </ul>
  )
}
