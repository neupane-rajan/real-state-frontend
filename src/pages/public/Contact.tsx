import { Col, Container, Row } from 'react-bootstrap'
import { InquiryForm } from '../../components/common/InquiryForm'
import { MailIcon, MapPinIcon, PhoneIcon, WhatsAppIcon } from '../../components/common/Icons'
import { PageHeader } from '../../components/common/PageHeader'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'

const directionsUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export function Contact() {
  const { language } = useLanguage()
  const isNp = language === 'np'

  usePageMeta({
    title: isNp ? 'सम्पर्क' : 'Contact us',
    description: isNp
      ? 'फोन, व्हाट्सएप वा सन्देशमार्फत भूमिराज रियल स्टेटलाई सम्पर्क गर्नुहोस्।'
      : 'Call, WhatsApp or send an inquiry to Bhumiraj Real Estate in Dhangadhi, Kailali.',
  })

  const quickActions = [
    {
      key: 'call',
      icon: <PhoneIcon size={20} />,
      title: isNp ? 'फोन गर्नुहोस्' : 'Call us',
      value: companyInfo.phones[0],
      href: getPhoneHref(),
    },
    {
      key: 'whatsapp',
      icon: <WhatsAppIcon size={20} />,
      title: 'WhatsApp',
      value: isNp ? 'च्याट सुरु गर्नुहोस्' : 'Start a chat',
      href: getWhatsAppUrl(),
      external: true,
    },
    {
      key: 'email',
      icon: <MailIcon size={20} />,
      title: isNp ? 'इमेल' : 'Email',
      value: companyInfo.email,
      href: `mailto:${companyInfo.email}`,
    },
    {
      key: 'visit',
      icon: <MapPinIcon size={20} />,
      title: isNp ? 'कार्यालयमा आउनुहोस्' : 'Visit us',
      value: isNp ? 'पहलमानपुर र धनगढी' : 'Pahalmanpur & Dhangadhi',
      href: '#contact-offices',
    },
  ]

  return (
    <div>
      <PageHeader
        title={isNp ? 'हामीलाई सम्पर्क गर्नुहोस्' : 'Get in touch'}
        subtitle={isNp
          ? 'सम्पत्ति किन्न, बेच्न वा लगानी सल्लाहका लागि फोन, व्हाट्सएप वा सन्देश पठाउनुहोस्।'
          : 'Call, WhatsApp or send us a message about buying, selling or investing in property.'}
        crumbs={[{ label: isNp ? 'सम्पर्क' : 'Contact' }]}
      />

      <section className="section-block section-block--tight">
        <Container>
          <ul className="contact-actions">
            {quickActions.map((action) => (
              <li key={action.key}>
                <a
                  href={action.href}
                  className={`contact-action contact-action--${action.key}`}
                  {...(action.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <span className="contact-action__icon">{action.icon}</span>
                  <span className="contact-action__text">
                    <strong>{action.title}</strong>
                    <span>{action.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <Row className="g-4 align-items-start">
            <Col lg={7}>
              <div className="pd-card">
                <h2 className="pd-card__title mb-1">{isNp ? 'सन्देश पठाउनुहोस्' : 'Send an inquiry'}</h2>
                <p className="text-muted mb-4">
                  {isNp ? 'आफ्नो नाम र फोन नम्बर छोड्नुहोस्, हामी सम्पर्क गर्नेछौं।' : 'Leave your name and phone number and we will get back to you.'}
                </p>
                <InquiryForm />
              </div>
            </Col>
            <Col lg={5}>
              <section id="contact-offices" className="pd-card pd-anchor" aria-labelledby="contact-offices-heading">
                <h2 id="contact-offices-heading" className="pd-card__title">{isNp ? 'हाम्रा कार्यालयहरू' : 'Our offices'}</h2>
                <ul className="contact-offices">
                  {companyInfo.offices.map((office) => (
                    <li key={office.labelEn}>
                      <span className="home-offices__marker" aria-hidden="true"><MapPinIcon size={18} /></span>
                      <div>
                        <h3>{isNp ? office.labelNp : office.labelEn}</h3>
                        <p>{isNp ? office.placeNp : office.placeEn}</p>
                        <a href={directionsUrl(office.mapQuery)} target="_blank" rel="noopener noreferrer">
                          {isNp ? 'बाटो हेर्नुहोस्' : 'Get directions'} <span aria-hidden="true">↗</span>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="pd-map">
                  <iframe
                    title={isNp ? 'शाखा कार्यालयको नक्सा' : 'Branch office map'}
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(companyInfo.offices[1].mapQuery)}&z=14&output=embed`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
                <p className="contact-phones">
                  <PhoneIcon size={14} />
                  {companyInfo.phones.map((phone) => (
                    <a key={phone} href={getPhoneHref(phone)}>{phone}</a>
                  ))}
                </p>
              </section>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}
