import { Container, Nav, Navbar as BootstrapNavbar } from 'react-bootstrap'
import { Link, NavLink } from 'react-router-dom'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '../common/Icons'

const navItems = [
  { to: '/', key: 'navHome', end: true },
  { to: '/properties', key: 'navProperties' },
  { to: '/about', key: 'navAbout' },
  { to: '/blogs', key: 'navBlogs' },
  { to: '/contact', key: 'navContact' },
] as const

export function Navbar() {
  const { language, toggleLanguage, t } = useLanguage()
  const isNp = language === 'np'
  const [primaryPhone, ...otherPhones] = companyInfo.phones

  return (
    <>
      {/* Office details strip — scrolls away; only the main bar stays sticky */}
      <div className="site-topbar">
        <Container className="site-topbar__inner">
          <span className="site-topbar__item">
            <MapPinIcon size={14} />
            {isNp ? companyInfo.addressNp : companyInfo.address}
          </span>
          <span className="site-topbar__links">
            {otherPhones.map((phone) => (
              <a key={phone} href={getPhoneHref(phone)} className="site-topbar__item">
                <PhoneIcon size={12} />
                {phone}
              </a>
            ))}
            <a href={`mailto:${companyInfo.email}`} className="site-topbar__item">
              <MailIcon size={13} />
              {companyInfo.email}
            </a>
          </span>
        </Container>
      </div>

      <BootstrapNavbar expand="lg" collapseOnSelect className="site-navbar">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/" className="brand-lockup">
            <img src="/logo-small.webp" alt="" width={40} height={40} />
            <span>
              <strong>{isNp ? companyInfo.nameNp : companyInfo.nameEn}</strong>
              <small>{isNp ? companyInfo.nameEn : companyInfo.nameNp}</small>
            </span>
          </BootstrapNavbar.Brand>

          <BootstrapNavbar.Toggle
            aria-controls="site-navbar-nav"
            label={isNp ? 'मेनु खोल्नुहोस्' : 'Toggle navigation'}
          />

          <BootstrapNavbar.Collapse id="site-navbar-nav">
            <Nav as="ul" className="site-nav-links ms-lg-auto">
              {navItems.map((item) => (
                <Nav.Item as="li" key={item.to}>
                  <Nav.Link as={NavLink} to={item.to} end={'end' in item} eventKey={item.to}>
                    {t(item.key)}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="site-nav-actions">
              <a
                href={getPhoneHref(primaryPhone)}
                className="btn btn-primary site-nav-call"
                aria-label={`${isNp ? 'फोन गर्नुहोस्' : 'Call'} ${primaryPhone}`}
              >
                <PhoneIcon size={14} />
                <span>{primaryPhone}</span>
              </a>
              {/* Mobile menu only: desktop visitors have the floating WhatsApp button */}
              <a
                href={getWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp site-nav-whatsapp"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                className="site-nav-lang"
                onClick={toggleLanguage}
                aria-label={isNp ? 'Switch to English' : 'नेपालीमा हेर्नुहोस्'}
                lang={isNp ? 'en' : 'ne'}
              >
                {isNp ? 'English' : 'नेपाली'}
              </button>
            </div>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </>
  )
}
