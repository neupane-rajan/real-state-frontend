import { useState } from 'react'
import { Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'
import { MapPinIcon, PhoneIcon, WhatsAppIcon } from '../common/Icons'
import { KailaliMap } from './KailaliMap'

const directionsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

// Kailali map with both offices pinned, next to the ways to get in touch.
export function HomeOffices() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [activeOffice, setActiveOffice] = useState<number | null>(null)

  return (
    <section className="section-block home-offices" aria-labelledby="home-offices-title">
      <Container>
        <div className="home-offices__grid">
          <KailaliMap activeOffice={activeOffice} onActiveOfficeChange={setActiveOffice} />

          <div className="home-offices__content">
            <h2 id="home-offices-title">{isNp ? 'कैलालीमा हाम्रा दुई कार्यालय' : 'Two offices in Kailali'}</h2>
            <p className="home-offices__intro">
              {isNp
                ? 'सम्पत्ति हेर्न, बेच्न वा लगानीबारे सल्लाह लिन नजिकको कार्यालयमा आउनुहोस् वा सिधै फोन गर्नुहोस्।'
                : 'Visit the office nearest to you or call us about viewing a property, selling yours, or investment advice.'}
            </p>

            <ul className="home-offices__list">
              {companyInfo.offices.map((office, index) => (
                <li
                  key={office.labelEn}
                  className={activeOffice === index ? 'is-active' : ''}
                  onMouseEnter={() => setActiveOffice(index)}
                  onMouseLeave={() => setActiveOffice(null)}
                  onFocus={() => setActiveOffice(index)}
                  onBlur={() => setActiveOffice(null)}
                >
                  <span className="home-offices__marker" aria-hidden="true">
                    <MapPinIcon size={18} />
                  </span>
                  <div>
                    <h3>{isNp ? office.labelNp : office.labelEn}</h3>
                    <p>{isNp ? office.placeNp : office.placeEn}</p>
                    <a href={directionsUrl(office.mapQuery)} target="_blank" rel="noopener noreferrer">
                      {isNp ? 'गुगल म्याप्समा बाटो हेर्नुहोस्' : 'Directions on Google Maps'} <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </li>
              ))}
            </ul>

            <p className="home-offices__phones">
              <PhoneIcon size={14} />
              {companyInfo.phones.map((phone) => (
                <a key={phone} href={getPhoneHref(phone)}>{phone}</a>
              ))}
            </p>

            <div className="home-offices__actions">
              <a href={getPhoneHref()} className="btn btn-primary">
                <PhoneIcon />
                <span>{isNp ? 'फोन गर्नुहोस्' : 'Call now'}</span>
              </a>
              <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                <WhatsAppIcon />
                <span>WhatsApp</span>
              </a>
              <Link to="/contact" className="btn btn-outline-secondary">
                {isNp ? 'सन्देश पठाउनुहोस्' : 'Send a message'}
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
