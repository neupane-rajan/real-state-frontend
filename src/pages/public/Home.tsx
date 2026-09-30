import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getBanners } from '../../api/banners'
import { getFaqs } from '../../api/faqs'
import { getProperties } from '../../api/properties'
import { getTestimonialAvatar, getTestimonials } from '../../api/testimonials'
import { getBlogs } from '../../api/blogs'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { BlogCard } from '../../components/blog/BlogCard'
import { CheckIcon, StarIcon } from '../../components/common/Icons'
import { BrowseByType } from '../../components/home/BrowseByType'
import { HomeHero } from '../../components/home/HomeHero'
import { HomeOffices } from '../../components/home/HomeOffices'
import { PropertyCard } from '../../components/property/PropertyCard'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'

// Plain section heading: title, one line of context, and an optional text link.
function SectionHeader({ title, intro, link }: { title: string; intro?: string; link?: ReactNode }) {
  return (
    <div className="home-section-header">
      <div>
        <h2>{title}</h2>
        {intro ? <p>{intro}</p> : null}
      </div>
      {link}
    </div>
  )
}

export function Home() {
  const { t, language } = useLanguage()
  const isNp = language === 'np'
  usePageMeta({})

  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: getBanners,
  })
  // Backend orders featured listings first.
  const propertiesQuery = useQuery({
    queryKey: ['properties', 'home'],
    queryFn: () => getProperties({ limit: 6 }),
  })
  const testimonialsQuery = useQuery({
    queryKey: ['testimonials'],
    queryFn: getTestimonials,
  })
  const faqsQuery = useQuery({
    queryKey: ['faqs'],
    queryFn: getFaqs,
  })
  const blogsQuery = useQuery({
    queryKey: ['blogs'],
    queryFn: getBlogs,
  })

  const banners = bannersQuery.data ?? []
  const featuredProperties = propertiesQuery.data ?? []
  const testimonials = (testimonialsQuery.data ?? []).slice(0, 3)
  const faqs = (faqsQuery.data ?? []).slice(0, 3)
  const latestBlogs = (blogsQuery.data ?? []).slice(0, 3)

  const services = [t('service1'), t('service2'), t('service3'), t('service4')]
  const viewAllLink = (to: string) => (
    <Link to={to} className="home-section-header__link">
      {t('viewAll')} <span aria-hidden="true">→</span>
    </Link>
  )

  return (
    <div className="home-page">
      <HomeHero banners={banners} latestProperty={featuredProperties[0]} />

      <BrowseByType />

      <section className="section-block">
        <Container>
          <SectionHeader
            title={isNp ? 'हालै थपिएका सम्पत्ति' : 'Recently listed'}
            intro={isNp ? 'बिक्रीका लागि उपलब्ध जग्गा, घर र फ्ल्याटहरू।' : 'Land, houses and flats currently available.'}
            link={viewAllLink('/properties')}
          />
          {propertiesQuery.isLoading ? <Loader label={isNp ? 'सम्पत्तिहरू लोड हुँदैछ…' : 'Loading properties…'} /> : null}
          {propertiesQuery.isError ? (
            <ErrorState
              title={isNp ? 'सम्पत्तिहरू लोड गर्न सकिएन' : 'Could not load properties'}
              message={isNp ? 'कृपया केही समयपछि फेरि प्रयास गर्नुहोस्।' : 'Please refresh the page or try again shortly.'}
            />
          ) : null}
          {propertiesQuery.isSuccess && featuredProperties.length === 0 ? (
            <EmptyState
              title={isNp ? 'हाल कुनै सम्पत्ति उपलब्ध छैन' : 'No properties available at the moment'}
              message={isNp ? 'छिट्टै नयाँ सम्पत्ति थपिनेछ। थप जानकारीका लागि सम्पर्क गर्नुहोस्।' : 'New listings are added regularly. Contact us to tell us what you are looking for.'}
            />
          ) : null}
          {!propertiesQuery.isError && featuredProperties.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {featuredProperties.map((property) => (
                <Col key={property.id}>
                  <PropertyCard property={property} />
                </Col>
              ))}
            </Row>
          ) : null}
        </Container>
      </section>

      <section className="section-block home-about" aria-labelledby="home-about-title">
        <Container>
          <div className="home-about__grid">
            <div>
              <h2 id="home-about-title" className="home-about__title">
                {isNp ? '१० वर्षदेखि कैलालीको घर-जग्गा कारोबारमा' : 'Ten years in Kailali real estate'}
              </h2>
              <p className="home-about__text">{isNp ? companyInfo.teaserNp : companyInfo.teaserEn}</p>
              <Link to="/about" className="home-section-header__link">
                {isNp ? 'हाम्रो बारेमा थप पढ्नुहोस्' : 'More about us'} <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ul className="home-about__services" aria-label={isNp ? 'हाम्रा सेवाहरू' : 'Our services'}>
              {services.map((service) => (
                <li key={service}>
                  <CheckIcon />
                  <span>{service}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      {blogsQuery.isLoading || latestBlogs.length > 0 ? (
      <section className="section-block">
        <Container>
          <SectionHeader title={t('latestBlogs')} intro={t('latestBlogsSubtitle')} link={viewAllLink('/blogs')} />
          {blogsQuery.isLoading ? <Loader label={isNp ? 'लेखहरू लोड हुँदैछ…' : 'Loading articles…'} /> : null}
          {blogsQuery.isError ? <ErrorState title={isNp ? 'लेखहरू लोड गर्न सकिएन' : 'Could not load blog posts'} /> : null}
          {!blogsQuery.isError && latestBlogs.length > 0 ? (
            <div className="blog-grid">
              {latestBlogs.map((blog) => <BlogCard key={String(blog.id)} blog={blog} />)}
            </div>
          ) : null}
        </Container>
      </section>
      ) : null}

      {testimonialsQuery.isLoading || testimonials.length > 0 ? (
      <section className="section-block section-block--soft">
        <Container>
          <SectionHeader title={t('testimonials')} intro={t('testiSubtitle')} />
          {testimonialsQuery.isLoading ? <Loader label={isNp ? 'लोड हुँदैछ…' : 'Loading…'} /> : null}
          {testimonialsQuery.isError ? <ErrorState title={isNp ? 'लोड गर्न सकिएन' : 'Could not load testimonials'} /> : null}
          {!testimonialsQuery.isError && testimonials.length > 0 ? (
            <Row xs={1} md={2} lg={3} className="g-4">
              {testimonials.map((testimonial) => {
                const avatar = getTestimonialAvatar(testimonial)

                return (
                  <Col key={String(testimonial.id ?? testimonial.clientName)}>
                    <figure className="testimonial-card">
                      <div className="testimonial-card__stars" aria-label={`${testimonial.rating ?? 5} / 5`}>
                        {Array.from({ length: 5 }, (_, i) => (
                          <StarIcon key={i} className={i < Number(testimonial.rating ?? 5) ? 'is-on' : ''} />
                        ))}
                      </div>
                      <blockquote className="mb-3">“{testimonial.message}”</blockquote>
                      <figcaption className="testimonial-card__person mb-0">
                        {avatar ? (
                          <img src={avatar} alt="" />
                        ) : (
                          <span aria-hidden="true">{testimonial.clientName?.charAt(0) ?? 'C'}</span>
                        )}
                        <div>
                          <h3>{testimonial.clientName}</h3>
                          {testimonial.role || testimonial.company ? <p>{testimonial.role ?? testimonial.company}</p> : null}
                        </div>
                      </figcaption>
                    </figure>
                  </Col>
                )
              })}
            </Row>
          ) : null}
        </Container>
      </section>
      ) : null}

      {faqsQuery.isLoading || faqs.length > 0 ? (
      <section className="section-block">
        <Container>
          <Row className="g-4 align-items-start">
            <Col lg={5}>
              <SectionHeader title={t('faqs')} intro={t('faqsSubtitle')} />
            </Col>
            <Col lg={7}>
              {faqsQuery.isLoading ? <Loader label={isNp ? 'लोड हुँदैछ…' : 'Loading…'} /> : null}
              {faqsQuery.isError ? <ErrorState title={isNp ? 'लोड गर्न सकिएन' : 'Could not load FAQs'} /> : null}
              {!faqsQuery.isError && faqs.length > 0 ? (
                <Accordion className="faq-accordion">
                  {faqs.map((faq, index) => (
                    <Accordion.Item eventKey={String(index)} key={String(faq.id ?? faq.question)}>
                      <Accordion.Header>{faq.question}</Accordion.Header>
                      <Accordion.Body>{faq.answer}</Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              ) : null}
            </Col>
          </Row>
        </Container>
      </section>
      ) : null}

      <HomeOffices />
    </div>
  )
}
