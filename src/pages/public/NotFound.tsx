import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { companyInfo } from '../../constants/companyInfo'
import { getPhoneHref } from '../../utils/contact'

export function NotFound() {
  const { language } = useLanguage()
  const isNp = language === 'np'

  usePageMeta({ title: isNp ? 'पृष्ठ फेला परेन' : 'Page not found' })

  const links = [
    { to: '/properties', label: isNp ? 'सबै सम्पत्ति हेर्नुहोस्' : 'Browse all properties' },
    { to: '/contact', label: isNp ? 'सम्पर्क गर्नुहोस्' : 'Contact us' },
    { to: '/', label: isNp ? 'गृहपृष्ठ' : 'Home page' },
  ]

  return (
    <section className="not-found">
      <Container>
        <p className="not-found__code">404</p>
        <h1 className="not-found__title">
          {isNp ? 'यो पृष्ठ फेला परेन' : 'We couldn’t find that page'}
        </h1>
        <p className="not-found__text">
          {isNp
            ? 'लिङ्क पुरानो भएको वा पृष्ठ हटाइएको हुन सक्छ। तलका लिङ्कबाट जारी राख्नुहोस्, वा हामीलाई '
            : 'The link may be out of date or the page may have been removed. Try one of these, or call us on '}
          <a href={getPhoneHref()}>{companyInfo.phones[0]}</a>
          {isNp ? ' मा फोन गर्नुहोस्।' : '.'}
        </p>
        <ul className="not-found__links">
          {links.map((link) => (
            <li key={link.to}>
              <Link to={link.to} className="home-section-header__link">
                {link.label} <span aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
