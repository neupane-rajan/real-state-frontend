import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container, Form } from 'react-bootstrap'
import { getBlogs, type BlogPost } from '../../api/blogs'
import { BlogCard } from '../../components/blog/BlogCard'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { PageHeader } from '../../components/common/PageHeader'
import { useLanguage } from '../../hooks/useLanguage'
import { usePageMeta } from '../../hooks/usePageMeta'

export function Blogs() {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [searchTerm, setSearchTerm] = useState('')

  usePageMeta({
    title: isNp ? 'ब्लग' : 'Blog',
    description: isNp
      ? 'घर-जग्गा खरिद, बिक्री र लगानी सम्बन्धी सुझाव तथा ताजा अपडेटहरू।'
      : 'Guides and updates on buying, selling and investing in property in Kailali.',
  })

  const { data: blogs = [], isLoading, isError } = useQuery({ queryKey: ['blogs'], queryFn: getBlogs })

  const query = searchTerm.trim().toLowerCase()
  const filtered = blogs.filter((blog: BlogPost) =>
    !query || `${blog.title ?? ''} ${blog.content ?? ''}`.toLowerCase().includes(query),
  )
  // The newest article is featured unless the visitor is searching.
  const [featured, ...rest] = query ? [undefined, ...filtered] : filtered

  return (
    <div className="blogs-page">
      <PageHeader
        title={isNp ? 'घर-जग्गा सम्बन्धी जानकारी' : 'Property guides & news'}
        subtitle={isNp ? 'घर-जग्गा खरिद, बिक्री र लगानी सम्बन्धी सुझाव तथा ताजा अपडेटहरू।' : 'Tips and updates on buying, selling and investing in property.'}
        crumbs={[{ label: isNp ? 'ब्लग' : 'Blog' }]}
      >
        <Form.Group controlId="blog-search" className="page-hero__search">
          <Form.Label className="visually-hidden">{isNp ? 'लेख खोज्नुहोस्' : 'Search articles'}</Form.Label>
          <Form.Control
            type="search"
            placeholder={isNp ? 'लेख खोज्नुहोस्…' : 'Search articles…'}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </Form.Group>
      </PageHeader>

      <section className="section-block section-block--tight">
        <Container>
          {isLoading ? <Loader label={isNp ? 'लेखहरू लोड हुँदैछन्…' : 'Loading articles…'} /> : null}
          {isError ? <ErrorState title={isNp ? 'लेखहरू लोड गर्न सकिएन' : 'Could not load articles'} /> : null}
          {!isLoading && !isError && filtered.length === 0 ? (
            <EmptyState
              title={query ? (isNp ? 'कुनै लेख भेटिएन' : 'No articles found') : (isNp ? 'छिट्टै लेखहरू आउँदैछन्' : 'Articles coming soon')}
              message={query ? (isNp ? 'कृपया अर्को शब्द खोज्नुहोस्।' : 'Try another keyword.') : (isNp ? 'घर-जग्गा सम्बन्धी उपयोगी जानकारी छिट्टै थपिनेछ।' : 'Useful property guides will be added soon.')}
            />
          ) : null}

          {featured ? (
            <div className="mb-4">
              <BlogCard blog={featured} variant="featured" />
            </div>
          ) : null}
          {rest.length > 0 ? (
            <div className="blog-grid">
              {rest.map((blog) => (blog ? <BlogCard key={String(blog.id)} blog={blog} /> : null))}
            </div>
          ) : null}
        </Container>
      </section>
    </div>
  )
}
