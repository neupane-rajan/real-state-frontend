import { Col, Container, Row } from 'react-bootstrap'
import { InquiryForm } from '../../components/common/InquiryForm'
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '../../components/common/Icons'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'

export function Contact() {
  const { language } = useLanguage()
  const isNp = language === 'np'

  usePageMeta({
    title: isNp ? 'सम्पर्क' : 'Contact us',
    description: isNp
      ? 'फोन, व्हाट्सएप वा सन्देशमार्फत भूमिराज रियल स्टेटलाई सम्पर्क गर्नुहोस्।'
      : 'Call, WhatsApp or send an inquiry to Bhumiraj Real Estate in Dhangadhi, Kailali.',
  })

  return (
    <div>
      <section className="page-hero">
        <Container>
          <p className="eyebrow">{isNp ? 'सम्पर्क' : 'Contact'}</p>
          <h1 className="page-hero__title">{isNp ? 'हामीलाई सम्पर्क गर्नुहोस्' : 'Get in touch'}</h1>
          <p className="page-hero__subtitle">
            {isNp
              ? 'सम्पत्ति किन्न, बेच्न वा लगानी सल्लाहका लागि फोन, व्हाट्सएप वा सन्देश पठाउनुहोस्।'
              : 'Call, WhatsApp or send us a message about buying, selling or investing in property.'}
          </p>
        </Container>
      </section>

      <section className="section-block section-block--tight">
        <Container>
          <Row className="g-4 g-lg-5 align-items-start">
            <Col lg={5}>
              <ul className="contact-list">
                <li>
                  <span className="contact-list__icon"><PhoneIcon size={18} /></span>
                  <div>
                    <h2 className="contact-list__label">{isNp ? 'फोन' : 'Phone'}</h2>
                    <div className="contact-list__values">
                      {companyInfo.phones.map((phone) => (
                        <a key={phone} href={getPhoneHref(phone)}>{phone}</a>
                      ))}
                    </div>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon contact-list__icon--whatsapp"><WhatsAppIcon size={18} /></span>
                  <div>
                    <h2 className="contact-list__label">WhatsApp</h2>
                    <div className="contact-list__values">
                      <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                        {companyInfo.whatsapp}
                      </a>
                    </div>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon"><MailIcon size={18} /></span>
                  <div>
                    <h2 className="contact-list__label">{isNp ? 'इमेल' : 'Email'}</h2>
                    <div className="contact-list__values">
                      <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a>
                    </div>
                  </div>
                </li>
                <li>
                  <span className="contact-list__icon"><MapPinIcon size={18} /></span>
                  <div>
                    <h2 className="contact-list__label">{isNp ? 'कार्यालय' : 'Office'}</h2>
                    <p className="contact-list__values mb-0">{isNp ? companyInfo.addressNp : companyInfo.address}</p>
                  </div>
                </li>
              </ul>

              <div className="contact-map">
                <iframe
                  title={isNp ? 'शाखा कार्यालयको नक्सा' : 'Branch office map'}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(companyInfo.offices[1].mapQuery)}&z=14&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <p>
                  {isNp ? companyInfo.offices[1].labelNp : companyInfo.offices[1].labelEn}:{' '}
                  {isNp ? companyInfo.offices[1].placeNp : companyInfo.offices[1].placeEn}
                </p>
              </div>
            </Col>
            <Col lg={7}>
              <div className="surface-card">
                <h2 className="surface-card__title">{isNp ? 'सन्देश पठाउनुहोस्' : 'Send an inquiry'}</h2>
                <p className="text-muted mb-4">
                  {isNp ? 'हामी सामान्यतया एक कार्यदिवसभित्र जवाफ दिन्छौं।' : 'We usually reply within one working day.'}
                </p>
                <InquiryForm />
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}
