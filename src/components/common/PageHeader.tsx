import type { ReactNode } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'

type Crumb = { label: string; to?: string }

type PageHeaderProps = {
  title: string
  subtitle?: string
  crumbs?: Crumb[]
  children?: ReactNode // e.g. a search bar under the title
}

// Compact header band for inner pages: breadcrumb, title, one line of context.
export function PageHeader({ title, subtitle, crumbs = [], children }: PageHeaderProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const trail: Crumb[] = [{ label: isNp ? 'होम' : 'Home', to: '/' }, ...crumbs]

  return (
    <section className="page-hero">
      <Container>
        <nav aria-label={isNp ? 'ब्रेडक्रम' : 'Breadcrumb'} className="page-hero__crumbs">
          <ol>
            {trail.map((crumb, index) => (
              <li key={crumb.label} aria-current={index === trail.length - 1 ? 'page' : undefined}>
                {crumb.to && index < trail.length - 1 ? <Link to={crumb.to}>{crumb.label}</Link> : crumb.label}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="page-hero__title">{title}</h1>
        {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
        {children ? <div className="page-hero__extra">{children}</div> : null}
      </Container>
    </section>
  )
}
