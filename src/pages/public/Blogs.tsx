import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container, Row, Col, Card, Form, InputGroup } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getBlogs, type BlogPost } from '../../api/blogs'
import { Loader } from '../../components/common/Loader'
import { ErrorState } from '../../components/common/ErrorState'
import { EmptyState } from '../../components/common/EmptyState'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl } from '../../utils/images'

export function Blogs() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [searchTerm, setSearchTerm] = useState('')

  const { data: blogs = [], isLoading, isError, error } = useQuery({
    queryKey: ['blogs'],
    queryFn: getBlogs,
  })

  const filteredBlogs = blogs.filter((blog: BlogPost) => {
    const title = blog.title?.toLowerCase() || ''
    const content = blog.content?.toLowerCase() || ''
    const query = searchTerm.toLowerCase()
    return title.includes(query) || content.includes(query)
  })

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(isNp ? 'ne-NP' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="blogs-page-layout">
      <section className="page-hero">
        <Container>
          <p className="eyebrow">{isNp ? 'ब्लग' : 'Blog'}</p>
          <h1 className="page-hero__title">{isNp ? 'घर-जग्गा सम्बन्धी जानकारी' : 'Property guides & news'}</h1>
          <p className="page-hero__subtitle">
            {isNp
              ? 'घर-जग्गा खरिद, बिक्री र लगानी सम्बन्धी सुझाव तथा ताजा अपडेटहरू।'
              : 'Tips and updates on buying, selling and investing in property.'}
          </p>
        </Container>
      </section>

      {/* Filter and Content section */}
      <Container className="py-5">
        <Row className="justify-content-center mb-5">
          <Col md={6}>
            <InputGroup className="shadow-sm border-0 rounded-pill overflow-hidden">
              <Form.Control
                placeholder={isNp ? 'लेख वा शीर्षक खोज्नुहोस्...' : 'Search articles...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="py-3 px-4 border-0"
                style={{ fontSize: '1rem' }}
              />
            </InputGroup>
          </Col>
        </Row>

        {isLoading ? (
          <Loader label={isNp ? 'लेखहरू लोड हुँदैछन्...' : 'Loading articles...'} />
        ) : isError ? (
          <ErrorState
            title={isNp ? 'लोड गर्न सकिएन' : 'Failed to load blogs'}
            message={error instanceof Error ? error.message : undefined}
          />
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            title={isNp ? 'कुनै लेख भेटिएन' : 'No articles found'}
            message={isNp ? 'कृपया अर्को शब्द खोज्नुहोस्।' : 'Try searching for another keyword.'}
          />
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {filteredBlogs.map((blog) => {
              const translated = blog
              return (
                <Col key={String(blog._id ?? blog.id)}>
                  <Card className="h-100 border-0 shadow-sm blog-card-premium overflow-hidden transition-all duration-300">
                    <div className="blog-card-img-wrapper position-relative">
                      {blog.coverImage ? (
                        <img
                          src={optimizedImageUrl(blog.coverImage, 640)}
                          alt=""
                          className="w-100 object-fit-cover"
                          style={{ height: '220px' }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="blog-card-img-placeholder" aria-hidden="true" />
                      )}
                      <div className="blog-card-badge position-absolute top-0 start-0 m-3 badge bg-primary">
                        {isNp ? 'जानकारी' : 'Insight'}
                      </div>
                    </div>
                    <Card.Body className="p-4 d-flex flex-column">
                      <div className="blog-card-meta d-flex justify-content-between text-muted mb-2" style={{ fontSize: '0.85rem' }}>
                        <span>By {blog.author}</span>
                        <span>{formatDate(blog.createdAt)}</span>
                      </div>
                      <Card.Title className="h5 fw-bold mb-3 text-dark line-clamp-2">
                        {translated.title}
                      </Card.Title>
                      <Card.Text className="text-muted line-clamp-3 mb-4" style={{ fontSize: '0.92rem', lineHeight: '1.6' }}>
                        {translated.content}
                      </Card.Text>
                      <Link
                        to={`/blogs/${blog.slug}`}
                        className="mt-auto text-primary fw-bold text-decoration-none d-inline-flex align-items-center gap-1 hover-gap"
                      >
                        {isNp ? 'थप पढ्नुहोस्' : 'Read Full Article'} &rarr;
                      </Link>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        )}
      </Container>
    </div>
  )
}
