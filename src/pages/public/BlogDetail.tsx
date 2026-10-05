import { useQuery } from '@tanstack/react-query'
import { Col, Container, Row } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { getBlogBySlug, getBlogs } from '../../api/blogs'
import { BlogCard } from '../../components/blog/BlogCard'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { PageHeader } from '../../components/common/PageHeader'
import { PhoneIcon, WhatsAppIcon } from '../../components/common/Icons'
import { companyInfo } from '../../constants/companyInfo'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'
import { getPhoneHref, getWhatsAppUrl } from '../../utils/contact'
import { optimizedImageUrl } from '../../utils/images'
import { formatDate, localDigits } from '../../utils/nepali'

export function BlogDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { language } = useLanguage()
  const isNp = language === 'np'

  const { data: blog, isLoading, isError } = useQuery({
    queryKey: ['blog', slug],
    queryFn: () => getBlogBySlug(slug ?? ''),
    enabled: Boolean(slug),
  })
  // Same cached list the blog page uses.
  const { data: allBlogs = [] } = useQuery({ queryKey: ['blogs'], queryFn: getBlogs })

  usePageMeta({
    title: blog?.title ?? (isNp ? 'लेख' : 'Article'),
    description: blog?.content?.slice(0, 160),
    image: blog?.coverImage ? optimizedImageUrl(blog.coverImage, 1200) : undefined,
  })

  if (isLoading) {
    return (
      <Container className="py-5">
        <Loader label={isNp ? 'लेख लोड हुँदैछ…' : 'Loading article…'} />
      </Container>
    )
  }

  if (isError || !blog) {
    return (
      <Container className="py-5">
        <ErrorState
          title={isNp ? 'लेख फेला परेन' : 'Article not found'}
          message={isNp ? 'यो लेख हटाइएको हुन सक्छ।' : 'This article may have been removed.'}
        />
        <div className="text-center mt-4">
          <Link to="/blogs" className="btn btn-primary">{isNp ? 'सबै लेखहरू' : 'All articles'}</Link>
        </div>
      </Container>
    )
  }

  const date = blog.createdAt
    ? formatDate(blog.createdAt, isNp)
    : ''
  const minutes = Math.max(1, Math.ceil((blog.content ?? '').split(/\s+/).length / 200))
  const paragraphs = (blog.content ?? '').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean)
  const recent = allBlogs.filter((item) => item.slug !== blog.slug).slice(0, 3)

  return (
    <article className="blog-reader-page">
      <PageHeader
        title={blog.title ?? ''}
        subtitle={[blog.author, date, isNp ? `${localDigits(minutes, true)} मिनेट पढाइ` : `${minutes} min read`].filter(Boolean).join(' · ')}
        crumbs={[{ label: isNp ? 'ब्लग' : 'Blog', to: '/blogs' }, { label: blog.title ?? '' }]}
      />

      <section className="section-block section-block--tight">
        <Container>
          <Row className="g-4 g-lg-5">
            <Col lg={8}>
              <div className="pd-card blog-reader">
                {blog.coverImage ? (
                  <img className="blog-reader__cover" src={optimizedImageUrl(blog.coverImage, 1400)} alt="" />
                ) : null}
                <div className="blog-reader__content">
                  {/* Blank lines separate paragraphs; single line breaks stay inside a paragraph.
                      A short first line that doesn't end a sentence is shown as a sub-heading. */}
                  {paragraphs.map((paragraph, index) => {
                    const [first, ...rest] = paragraph.split('\n')
                    if (rest.length > 0 && first.length <= 80 && !/[.,;]$/.test(first.trim())) {
                      return (
                        <section key={index}>
                          <h2 className="blog-reader__heading">{first.trim()}</h2>
                          <p>{rest.join('\n').trim()}</p>
                        </section>
                      )
                    }
                    return <p key={index}>{paragraph}</p>
                  })}
                </div>
              </div>
              <Link to="/blogs" className="home-section-header__link">
                <span aria-hidden="true">←</span> {isNp ? 'सबै लेखहरू' : 'All articles'}
              </Link>
            </Col>

            <Col lg={4}>
              <aside className="pd-sidebar">
                <section className="pd-card blog-cta" aria-labelledby="blog-cta-heading">
                  <h2 id="blog-cta-heading" className="pd-card__title mb-2">
                    {isNp ? 'सम्पत्ति खोज्दै हुनुहुन्छ?' : 'Looking for property?'}
                  </h2>
                  <p className="text-muted">
                    {isNp ? 'हाम्रो टोलीसँग सिधै कुरा गर्नुहोस्।' : 'Talk to our team directly about land, houses or plots.'}
                  </p>
                  <div className="pd-agent__actions">
                    <a href={getPhoneHref()} className="btn btn-outline-primary">
                      <PhoneIcon />
                      <span>{isNp ? 'फोन' : 'Call'}</span>
                    </a>
                    <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                      <WhatsAppIcon />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                  <Link to="/properties" className="btn btn-primary w-100 mt-2">
                    {isNp ? 'सम्पत्ति हेर्नुहोस्' : 'Browse properties'}
                  </Link>
                  <p className="pd-agent__phone">{companyInfo.phones.join(' · ')}</p>
                </section>

                {recent.length > 0 ? (
                  <section className="pd-card" aria-labelledby="blog-recent-heading">
                    <h2 id="blog-recent-heading" className="pd-card__title">{isNp ? 'अन्य लेखहरू' : 'More articles'}</h2>
                    <div className="blog-recent">
                      {recent.map((item) => <BlogCard key={String(item.id)} blog={item} variant="compact" />)}
                    </div>
                  </section>
                ) : null}
              </aside>
            </Col>
          </Row>
        </Container>
      </section>
    </article>
  )
}
