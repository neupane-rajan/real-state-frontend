import { Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { MapPinIcon, PhoneIcon, WhatsAppIcon } from '../../components/common/Icons'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'

// How a typical purchase works with the company. Confirm wording with the owner.
const steps = [
  {
    titleNp: 'सम्पर्क वा कार्यालय भ्रमण',
    titleEn: 'Call or visit us',
    textNp: 'फोन, व्हाट्सएप वा कार्यालयमै आएर तपाईंलाई कस्तो सम्पत्ति चाहिएको हो, बताउनुहोस्।',
    textEn: 'Tell us what you are looking for by phone, WhatsApp or at our office.',
  },
  {
    titleNp: 'स्थलगत भ्रमण',
    titleEn: 'Site visit',
    textNp: 'उपयुक्त जग्गा वा घर छानेर हामी तपाईंसँगै साइट हेर्न जान्छौं।',
    textEn: 'We shortlist suitable land or houses and visit the site with you.',
  },
  {
    titleNp: 'कागजात जाँच',
    titleEn: 'Document checks',
    textNp: 'लालपुर्जा, नक्सा र अन्य आवश्यक कागजात जाँच गर्न सहयोग गर्छौं।',
    textEn: 'We help you check the land ownership certificate, map and other documents.',
  },
  {
    titleNp: 'कारोबार सम्पन्न',
    titleEn: 'Deal completed',
    textNp: 'पारदर्शी रूपमा कारोबार टुंग्याउन अन्तिम चरणसम्म साथ दिन्छौं।',
    textEn: 'We stay with you until the transaction is completed transparently.',
  },
]

const mapLink = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

export function About() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const story = isNp ? companyInfo.storyNp : companyInfo.storyEn

  usePageMeta({
    title: isNp ? 'हाम्रो बारेमा' : 'About us',
    description: story[0],
  })

  return (
    <div className="about-page">
      <section className="page-hero">
        <Container>
          <p className="eyebrow">{isNp ? 'हाम्रो बारेमा' : 'About us'}</p>
          <h1 className="page-hero__title">{isNp ? companyInfo.nameNp : companyInfo.nameEn}</h1>
          <p className="page-hero__subtitle">{isNp ? companyInfo.taglineNp : companyInfo.taglineEn}</p>
        </Container>
      </section>

      <section className="section-block">
        <Container>
          <Row className="g-4 g-lg-5">
            <Col lg={4}>
              <figure className="about-founder">
                <img
                  src="/founder.webp"
                  alt={isNp ? companyInfo.founderTitleNp : 'Founder and Managing Director'}
                  width={800}
                  height={1236}
                  loading="lazy"
                />
                <figcaption>
                  <strong>{isNp ? companyInfo.founderTitleNp : 'Founder & Managing Director'}</strong>
                  <span>{isNp ? companyInfo.nameNp : companyInfo.nameEn}</span>
                </figcaption>
              </figure>
            </Col>
            <Col lg={8}>
              <h2 className="about-heading">{isNp ? 'हाम्रो कथा' : 'Our story'}</h2>
              <div className="about-story">
                {story.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              <blockquote className="about-quote">
                <p>{isNp ? companyInfo.founderMessageNp : 'Our priority is client trust, transparent transactions, and secure investments.'}</p>
                <footer>— {isNp ? companyInfo.founderTitleNp : 'Founder & Managing Director'}</footer>
              </blockquote>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="section-block about-steps-section" aria-labelledby="about-steps-title">
        <Container>
          <h2 id="about-steps-title" className="about-heading">{isNp ? 'हामी कसरी काम गर्छौं' : 'How we work'}</h2>
          <ol className="about-steps">
            {steps.map((step, index) => (
              <li key={step.titleEn}>
                <span className="about-steps__number" aria-hidden="true">
                  {isNp ? ['१', '२', '३', '४'][index] : index + 1}
                </span>
                <h3>{isNp ? step.titleNp : step.titleEn}</h3>
                <p>{isNp ? step.textNp : step.textEn}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="section-block" aria-labelledby="about-offices-title">
        <Container>
          <h2 id="about-offices-title" className="about-heading">{isNp ? 'हाम्रा कार्यालयहरू' : 'Our offices'}</h2>
          <Row className="g-4">
            {companyInfo.offices.map((office) => (
              <Col md={6} key={office.labelEn}>
                <div className="about-office">
                  <MapPinIcon size={20} className="about-office__icon" />
                  <div>
                    <h3>{isNp ? office.labelNp : office.labelEn}</h3>
                    <p>{isNp ? office.placeNp : office.placeEn}</p>
                    <a href={mapLink(office.mapQuery)} target="_blank" rel="noopener noreferrer" className="home-section-header__link">
                      {isNp ? 'नक्सामा हेर्नुहोस्' : 'Get directions'} <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
          <div className="about-cta">
            <a href={getPhoneHref()} className="btn btn-primary">
              <PhoneIcon />
              <span>{companyInfo.phones[0]}</span>
            </a>
            <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
            <Link to="/properties" className="btn btn-outline-secondary">
              {isNp ? 'सम्पत्ति हेर्नुहोस्' : 'Browse properties'}
            </Link>
          </div>
        </Container>
      </section>
    </div>
  )
}
