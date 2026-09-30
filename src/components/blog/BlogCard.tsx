import { Link } from 'react-router-dom'
import type { BlogPost } from '../../api/blogs'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl } from '../../utils/images'

type BlogCardProps = {
  blog: BlogPost
  variant?: 'grid' | 'featured' | 'compact'
}

// Plain-text preview of the article, cut at a word boundary.
// Uses the opening paragraph so sub-headings further down don't run into the text.
const excerpt = (content = '', length = 160) => {
  const text = (content.trim().split(/\n\s*\n/)[0] ?? '').replace(/\s+/g, ' ').trim()
  return text.length > length ? `${text.slice(0, length).replace(/\s+\S*$/, '')}…` : text
}

// One blog card used on the home page, the blog list and article sidebars.
export function BlogCard({ blog, variant = 'grid' }: BlogCardProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const date = blog.createdAt
    ? new Date(blog.createdAt).toLocaleDateString(isNp ? 'ne-NP' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''
  const minutes = Math.max(1, Math.ceil((blog.content ?? '').split(/\s+/).length / 200))

  return (
    <article className={`blog-card blog-card--${variant}`}>
      <div className="blog-card__media">
        {blog.coverImage ? (
          <img
            src={optimizedImageUrl(blog.coverImage, variant === 'featured' ? 1000 : variant === 'compact' ? 200 : 640)}
            alt=""
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="blog-card__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="blog-card__body">
        <p className="blog-card__meta">
          <span>{date}</span>
          {variant !== 'compact' ? <span>{isNp ? `${minutes} मिनेट पढाइ` : `${minutes} min read`}</span> : null}
        </p>
        <h3 className="blog-card__title">
          <Link to={`/blogs/${blog.slug}`} className="stretched-link">{blog.title}</Link>
        </h3>
        {variant !== 'compact' ? (
          <p className="blog-card__excerpt">{excerpt(blog.content, variant === 'featured' ? 260 : 140)}</p>
        ) : null}
        {variant !== 'compact' ? (
          <span className="blog-card__cta" aria-hidden="true">{isNp ? 'पूरा पढ्नुहोस्' : 'Read article'} →</span>
        ) : null}
      </div>
    </article>
  )
}
