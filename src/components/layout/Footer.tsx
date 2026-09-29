import { useQuery } from '@tanstack/react-query'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getPropertyMeta } from '../../api/properties'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'
import { translateCategory } from '../../utils/translateHelpers'
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '../common/Icons'

const footerLinks = [
  { to: '/', key: 'navHome' },
  { to: '/properties', key: 'navProperties' },
  { to: '/about', key: 'navAbout' },
  { to: '/blogs', key: 'navBlogs' },
  { to: '/contact', key: 'navContact' },
] as const

const directionsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export function Footer() {
  const { t, language } = useLanguage()
  const isNp = language === 'np'
  const companyName = isNp ? companyInfo.nameNp : companyInfo.nameEn

  // Same cached query the listing filters use, so this adds no extra request.
  const metaQuery = useQuery({
    queryKey: ['property-meta'],
    queryFn: getPropertyMeta,
    staleTime: 10 * 60 * 1000,
  })
  const categories = metaQuery.data?.categories ?? []

  return (
    <footer className="site-footer">
      <Container>
        <div className="site-footer__grid">
          <div className="site-footer__col--brand">
            <Link to="/" className="site-footer__brand">
              <img src="/logo-small.webp" alt="" width={44} height={44} loading="lazy" />
              <span>
                <strong>{companyName}</strong>
                <small>{isNp ? companyInfo.nameEn : companyInfo.nameNp}</small>
              </span>
            </Link>
            <p className="site-footer__about">{isNp ? companyInfo.taglineNp : companyInfo.taglineEn}</p>
            <div className="site-footer__actions">
              <a href={getPhoneHref()} className="btn btn-primary btn-sm">
                <PhoneIcon size={14} />
                <span>{companyInfo.phones[0]}</span>
              </a>
              <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon size={15} />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          {categories.length > 0 ? (
            <nav aria-labelledby="footer-types-heading" className="site-footer__col--types">
              <h2 id="footer-types-heading" className="site-footer__heading">
                {isNp ? 'सम्पत्तिका प्रकार' : 'Property types'}
              </h2>
              <ul className="site-footer__list">
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link to={`/properties?type=${encodeURIComponent(category.name)}`}>
                      {translateCategory(category.name, language)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          <nav aria-labelledby="footer-links-heading" className="site-footer__col--links">
            <h2 id="footer-links-heading" className="site-footer__heading">{t('footerQuickLinks')}</h2>
            <ul className="site-footer__list">
              {footerLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{t(link.key)}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer__col--contact">
            <h2 className="site-footer__heading">{isNp ? 'कार्यालय र सम्पर्क' : 'Offices & contact'}</h2>
            <ul className="site-footer__list site-footer__list--contact">
              {companyInfo.offices.map((office) => (
                <li key={office.labelEn}>
                  <MapPinIcon className="site-footer__icon" />
                  <span>
                    <strong className="site-footer__office">{isNp ? office.labelNp : office.labelEn}</strong>
                    <a href={directionsUrl(office.mapQuery)} target="_blank" rel="noopener noreferrer">
                      {isNp ? office.placeNp : office.placeEn}
                    </a>
                  </span>
                </li>
              ))}
              <li>
                <PhoneIcon className="site-footer__icon" />
                <span className="site-footer__phones">
                  {companyInfo.phones.map((phone) => (
                    <a key={phone} href={getPhoneHref(phone)}>{phone}</a>
                  ))}
                </span>
              </li>
              <li>
                <MailIcon className="site-footer__icon" />
                <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p>
            &copy; {new Date().getFullYear()} {companyName}. {isNp ? 'सर्वाधिकार सुरक्षित।' : 'All rights reserved.'}
          </p>
          <p>{isNp ? 'कैलाली, सुदूरपश्चिम प्रदेश, नेपाल' : 'Kailali, Sudurpashchim Province, Nepal'}</p>
        </div>
      </Container>
    </footer>
  )
}
