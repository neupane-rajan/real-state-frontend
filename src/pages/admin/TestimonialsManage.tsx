import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonialAvatar,
  getTestimonials,
  updateTestimonial,
  type Testimonial,
  type TestimonialFormPayload,
} from '../../api/testimonials'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { TranslateButton } from '../../components/admin/TranslateButton'

const emptyForm: TestimonialFormPayload = {
  clientName: '',
  role: '',
  company: '',
  message: '',
  rating: '5',
  clientNameNp: '',
  roleNp: '',
  messageNp: '',
}

export function TestimonialsManage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Testimonial | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const { data: testimonials = [], isLoading, isError } = useQuery({ queryKey: ['testimonials'], queryFn: getTestimonials })
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<TestimonialFormPayload>({ defaultValues: emptyForm })

  const startEdit = (testimonial: Testimonial | null) => {
    setEditing(testimonial)
    reset(
      testimonial
        ? {
            clientName: testimonial.clientName ?? '',
            role: testimonial.role ?? '',
            company: testimonial.company ?? '',
            message: testimonial.message ?? '',
            rating: String(testimonial.rating ?? 5),
            clientNameNp: testimonial.clientNameNp ?? '',
            roleNp: testimonial.roleNp ?? '',
            messageNp: testimonial.messageNp ?? '',
          }
        : emptyForm,
    )
    if (testimonial) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['testimonials'] })

  const saveMutation = useMutation({
    mutationFn: (payload: TestimonialFormPayload) =>
      editing?.id ? updateTestimonial(editing.id, payload) : createTestimonial(payload),
    onSuccess: async () => {
      setNotice({ type: 'success', text: editing ? 'Testimonial updated.' : 'Testimonial added. It now appears on the home page.' })
      startEdit(null)
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The testimonial could not be saved.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (testimonial: Testimonial) => deleteTestimonial(testimonial.id as number),
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'Testimonial deleted.' })
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The testimonial could not be deleted.') }),
  })

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Testimonials</h1>
          <p className="text-muted mb-0">What real clients said about you. The latest six appear on the home page. Only add reviews clients agreed to share.</p>
        </div>
      </div>

      {notice ? <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className="admin-panel">
        <h2 className="h6 fw-bold mb-3">{editing ? `Edit: ${editing.clientName}` : 'Add a testimonial'}</h2>
        <Form onSubmit={handleSubmit((payload) => { setNotice(null); saveMutation.mutate(payload) })} noValidate>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group controlId="testimonial-name">
                <Form.Label>Client name <span className="form-required">*</span></Form.Label>
                <Form.Control
                  isInvalid={Boolean(errors.clientName)}
                  {...register('clientName', {
                    required: 'Client name is required.',
                    minLength: { value: 2, message: 'Name is too short.' },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.clientName?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="testimonial-role">
                <Form.Label>Role <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control placeholder="e.g. Land buyer, Dhangadhi" {...register('role', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="testimonial-company">
                <Form.Label>Company <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control {...register('company', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="testimonial-rating">
                <Form.Label>Rating <span className="form-required">*</span></Form.Label>
                <Form.Select {...register('rating', { required: true })}>
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>{'★'.repeat(value)} ({value})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="testimonial-avatar">
                <Form.Label>
                  Photo <span className="form-optional">{editing ? '(optional — leave empty to keep the current one)' : '(optional)'}</span>
                </Form.Label>
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  isInvalid={Boolean(errors.avatar)}
                  {...register('avatar', {
                    validate: (files) => !files?.[0] || files[0].size <= 10 * 1024 * 1024 || 'The photo must be 10 MB or smaller.',
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.avatar?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="testimonial-message">
                <Form.Label>What they said <span className="form-required">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  isInvalid={Boolean(errors.message)}
                  {...register('message', {
                    required: 'Enter the testimonial text.',
                    minLength: { value: 5, message: 'The testimonial is too short.' },
                    maxLength: { value: 2000, message: 'Keep it under 2000 characters.' },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.message?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <div className="admin-np-heading">
                <strong>नेपाली (Nepali version)</strong>
                <span className="text-muted small">Shown when the site is in Nepali. Leave empty to show the English text.</span>
              </div>
              <TranslateButton
                getSources={() => [getValues('clientName') ?? '', getValues('role') ?? '', getValues('message') ?? '']}
                getCurrent={() => [getValues('clientNameNp') ?? '', getValues('roleNp') ?? '', getValues('messageNp') ?? '']}
                onTranslated={(texts) => {
                    setValue('clientNameNp', texts[0], { shouldDirty: true })
                    setValue('roleNp', texts[1], { shouldDirty: true })
                    setValue('messageNp', texts[2], { shouldDirty: true })
                }}
              />
            </Col>
            <Col md={12}>
              <Form.Group controlId="testimonials-clientNameNp">
                <Form.Label>नाम (Name in Nepali) <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control lang="ne" {...register('clientNameNp', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="testimonials-roleNp">
                <Form.Label>परिचय (Role in Nepali) <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control lang="ne" {...register('roleNp', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="testimonials-messageNp">
                <Form.Label>भनाइ (What they said, in Nepali) <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control as="textarea" rows={3} lang="ne" {...register('messageNp', { maxLength: 2000 })} />
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3 d-flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add testimonial'}
            </Button>
            {editing ? <Button variant="outline-secondary" onClick={() => startEdit(null)}>Cancel</Button> : null}
          </div>
        </Form>
      </div>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorState title="Could not load testimonials" /> : null}
      {!isLoading && !isError && testimonials.length === 0 ? (
        <div className="admin-panel"><p className="admin-panel__empty">No testimonials yet. The home page hides this section until you add one.</p></div>
      ) : null}

      {testimonials.length > 0 ? (
        <ul className="admin-card-list">
          {testimonials.map((testimonial) => {
            const avatar = getTestimonialAvatar(testimonial)
            return (
              <li key={String(testimonial.id)}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  {avatar ? <img className="admin-avatar" src={avatar} alt="" /> : <span className="admin-avatar admin-avatar--empty">{testimonial.clientName?.charAt(0)}</span>}
                  <div>
                    <strong>{testimonial.clientName}</strong>
                    <span className="d-block small text-muted">
                      {[testimonial.role, testimonial.company].filter(Boolean).join(' · ')}{' '}
                      <span aria-label={`${testimonial.rating} out of 5`}>{'★'.repeat(Number(testimonial.rating) || 0)}</span>
                    </span>
                  </div>
                </div>
                <p className="admin-card-list__text">{testimonial.message}</p>
                <div className="admin-row-actions">
                  <Button size="sm" variant="outline-primary" onClick={() => startEdit(testimonial)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm(`Delete the testimonial from ${testimonial.clientName}?`)) deleteMutation.mutate(testimonial)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
