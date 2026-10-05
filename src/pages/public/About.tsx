import { useQuery } from '@tanstack/react-query'
import { Col, Container, Row } from 'react-bootstrap'
import { getProperties } from '../../api/properties'
import { AreaIcon, HomeIcon, TagIcon, CheckIcon } from '../../components/common/Icons'
import { PageHeader } from '../../components/common/PageHeader'
import { HomeOffices } from '../../components/home/HomeOffices'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { localDigits } from '../../utils/nepali'

// The company's four services (from companyinfo.txt), with a one-line explanation each.
const services = [
  {
    icon: <AreaIcon size={22} />,
    titleNp: 'जग्गा खरिद–बिक्री',
    titleEn: 'Land buying & selling',
    textNp: 'उपयुक्त जग्गा खोज्न वा आफ्नो जग्गाका लागि खरिदकर्ता भेट्टाउन सहयोग।',
    textEn: 'Help finding the right land, or a buyer for yours.',
  },
  {
    icon: <HomeIcon size={22} />,
    titleNp: 'घर बिक्री',
    titleEn: 'House sales',
    textNp: 'घर बेच्न वा किन्न मूल्यदेखि कारोबारसम्म सहयोग।',
    textEn: 'Support with pricing, viewings and the sale itself.',
  },
  {
    icon: <TagIcon size={22} />,
    titleNp: 'प्लटिङ',
    titleEn: 'Plotting',
    textNp: 'ठूलो जग्गालाई प्लटमा विभाजन गरी बिक्री।',
    textEn: 'Dividing larger land into plots and selling them.',
  },
  {
    icon: <CheckIcon size={22} />,
    titleNp: 'लगानी परामर्श',
    titleEn: 'Investment advice',
    textNp: 'सुरक्षित रियल इस्टेट लगानीका लागि सल्लाह।',
    textEn: 'Advice on safe real estate investment.',
  },
]

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

export function About() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const story = isNp ? companyInfo.storyNp : companyInfo.storyEn

  usePageMeta({
    title: isNp ? 'हाम्रो बारेमा' : 'About us',
    description: story[0],
  })

  // Live count of published listings for the numbers band (shares the listing page cache).
  const { data: properties } = useQuery({ queryKey: ['properties'], queryFn: () => getProperties() })

  const numbers = [
    { value: isNp ? '१०+' : '10+', label: isNp ? 'वर्षको अनुभव' : 'years of experience' },
    { value: isNp ? 'हजारौं' : 'Thousands', label: isNp ? 'सन्तुष्ट ग्राहक' : 'of satisfied clients' },
    { value: isNp ? '२' : '2', label: isNp ? 'कार्यालय कैलालीमा' : 'offices in Kailali' },
    ...(properties && properties.length > 0
      ? [{ value: localDigits(properties.length, isNp), label: isNp ? 'हाल उपलब्ध सम्पत्ति' : 'listings available now' }]
      : []),
  ]

  return (
    <div className="about-page">
      <PageHeader
        title={isNp ? companyInfo.nameNp : companyInfo.nameEn}
        subtitle={isNp ? companyInfo.taglineNp : companyInfo.taglineEn}
        crumbs={[{ label: isNp ? 'हाम्रो बारेमा' : 'About us' }]}
      />

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

      <section className="about-numbers" aria-label={isNp ? 'मुख्य तथ्यहरू' : 'Key numbers'}>
        <Container>
          <dl className="about-numbers__grid">
            {numbers.map((item) => (
              <div key={item.label}>
                <dt>{item.value}</dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section className="section-block" aria-labelledby="about-services-title">
        <Container>
          <h2 id="about-services-title" className="about-heading">{isNp ? 'हाम्रा सेवाहरू' : 'What we do'}</h2>
          <ul className="about-services">
            {services.map((service) => (
              <li key={service.titleEn}>
                <span className="about-services__icon">{service.icon}</span>
                <h3>{isNp ? service.titleNp : service.titleEn}</h3>
                <p>{isNp ? service.textNp : service.textEn}</p>
              </li>
            ))}
          </ul>
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

      <HomeOffices />
    </div>
  )
}
