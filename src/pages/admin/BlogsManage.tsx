import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert, Button, Col, Form, Row, Table } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/axiosInstance'
import { createBlog, deleteBlog, getBlogs, updateBlog, type BlogFormPayload, type BlogPost } from '../../api/blogs'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { optimizedImageUrl } from '../../utils/images'

const emptyForm: BlogFormPayload = { title: '', content: '', author: '' }

export function BlogsManage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<BlogPost | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const { data: blogs = [], isLoading, isError } = useQuery({ queryKey: ['blogs'], queryFn: getBlogs })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BlogFormPayload>({ defaultValues: emptyForm })

  const startEdit = (blog: BlogPost | null) => {
    setEditing(blog)
    reset(blog ? { title: blog.title ?? '', content: blog.content ?? '', author: blog.author ?? '' } : emptyForm)
    if (blog) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['blogs'] })

  const saveMutation = useMutation({
    mutationFn: (payload: BlogFormPayload) => (editing?.id ? updateBlog(editing.id, payload) : createBlog(payload)),
    onSuccess: async (saved) => {
      setNotice({ type: 'success', text: editing ? `“${saved.title}” was updated.` : `“${saved.title}” was published.` })
      startEdit(null)
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The article could not be saved.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (blog: BlogPost) => deleteBlog(blog.id as number),
    onSuccess: async (_result, blog) => {
      setNotice({ type: 'success', text: `“${blog.title}” was deleted.` })
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The article could not be deleted.') }),
  })

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Blog</h1>
          <p className="text-muted mb-0">Articles appear on the Blog page and the latest three on the home page. Useful guides also help people find you on Google.</p>
        </div>
      </div>

      {notice ? <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className="admin-panel">
        <h2 className="h6 fw-bold mb-3">{editing ? `Edit: ${editing.title}` : 'Write a new article'}</h2>
        <Form onSubmit={handleSubmit((payload) => { setNotice(null); saveMutation.mutate(payload) })} noValidate>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId="blog-title">
                <Form.Label>Title <span className="form-required">*</span></Form.Label>
                <Form.Control
                  isInvalid={Boolean(errors.title)}
                  placeholder="e.g. Documents to check before buying land"
                  {...register('title', {
                    required: 'Title is required.',
                    minLength: { value: 3, message: 'Title must be at least 3 characters.' },
                    maxLength: { value: 200, message: 'Title must be 200 characters or fewer.' },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="blog-author">
                <Form.Label>Author <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control placeholder="Admin" {...register('author', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="blog-cover">
                <Form.Label>
                  Cover photo <span className="form-optional">{editing ? '(optional — leave empty to keep the current one)' : '(optional)'}</span>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  isInvalid={Boolean(errors.coverImage)}
                  {...register('coverImage', {
                    validate: (files) => !files?.[0] || files[0].size <= 10 * 1024 * 1024 || 'The photo must be 10 MB or smaller.',
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.coverImage?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="blog-content">
                <Form.Label>Article <span className="form-required">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={10}
                  isInvalid={Boolean(errors.content)}
                  {...register('content', { required: 'Write the article text.' })}
                />
                <Form.Control.Feedback type="invalid">{errors.content?.message}</Form.Control.Feedback>
                <Form.Text>Leave an empty line between paragraphs.</Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3 d-flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Publish article'}
            </Button>
            {editing ? <Button variant="outline-secondary" onClick={() => startEdit(null)}>Cancel</Button> : null}
          </div>
        </Form>
      </div>

      {isLoading ? <Loader label="Loading articles…" /> : null}
      {isError ? <ErrorState title="Could not load articles" /> : null}
      {!isLoading && !isError && blogs.length === 0 ? (
        <div className="admin-panel"><p className="admin-panel__empty">No articles yet. Write your first one above.</p></div>
      ) : null}

      {blogs.length > 0 ? (
        <div className="admin-panel p-0">
          <Table hover className="admin-table admin-table--stack mb-0">
            <thead>
              <tr>
                <th>Article</th>
                <th>Published</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((blog) => (
                <tr key={String(blog.id)}>
                  <td data-label="Article">
                    <div className="admin-property-cell">
                      {blog.coverImage ? <img src={optimizedImageUrl(blog.coverImage, 160)} alt="" className="admin-thumb" loading="lazy" /> : <span className="admin-thumb admin-thumb--empty" />}
                      <div>
                        <strong>{blog.title}</strong>
                        <span className="d-block small text-muted">{blog.author || 'Admin'}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Published" className="text-nowrap">
                    {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                  </td>
                  <td className="text-lg-end">
                    <div className="admin-row-actions">
                      <Link to={`/blogs/${blog.slug}`} target="_blank" className="btn btn-sm btn-link">View</Link>
                      <Button size="sm" variant="outline-primary" onClick={() => startEdit(blog)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete “${blog.title}”? This cannot be undone.`)) deleteMutation.mutate(blog)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : null}
    </section>
  )
}
