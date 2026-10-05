import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Accordion, Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../api/axiosInstance'
import { createFaq, deleteFaq, getFaqs, updateFaq, type Faq, type FaqFormPayload } from '../../api/faqs'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { TranslateButton } from '../../components/admin/TranslateButton'

const emptyForm: FaqFormPayload = { question: '', answer: '', category: '', questionNp: '', answerNp: '' }

export function FaqsManage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Faq | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const { data: faqs = [], isLoading, isError } = useQuery({ queryKey: ['faqs'], queryFn: getFaqs })
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<FaqFormPayload>({ defaultValues: emptyForm })

  const startEdit = (faq: Faq | null) => {
    setEditing(faq)
    reset(
      faq
        ? { question: faq.question ?? '', answer: faq.answer ?? '', category: faq.category ?? '', questionNp: faq.questionNp ?? '', answerNp: faq.answerNp ?? '' }
        : emptyForm,
    )
    if (faq) window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['faqs'] })

  const saveMutation = useMutation({
    mutationFn: (payload: FaqFormPayload) => (editing?.id ? updateFaq(editing.id, payload) : createFaq(payload)),
    onSuccess: async () => {
      setNotice({ type: 'success', text: editing ? 'Question updated.' : 'Question added.' })
      startEdit(null)
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The question could not be saved.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (faq: Faq) => deleteFaq(faq.id as number),
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'Question deleted.' })
      await invalidate()
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The question could not be deleted.') }),
  })

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">FAQs</h1>
          <p className="text-muted mb-0">Answers to questions buyers often ask. Up to eight appear on the home page.</p>
        </div>
      </div>

      {notice ? <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className="admin-panel">
        <h2 className="h6 fw-bold mb-3">{editing ? 'Edit question' : 'Add a question'}</h2>
        <Form onSubmit={handleSubmit((payload) => { setNotice(null); saveMutation.mutate(payload) })} noValidate>
          <Row className="g-3">
            <Col md={8}>
              <Form.Group controlId="faq-question">
                <Form.Label>Question <span className="form-required">*</span></Form.Label>
                <Form.Control
                  placeholder="e.g. मूल्य नेपाली रुपैयाँमा हो?"
                  isInvalid={Boolean(errors.question)}
                  {...register('question', {
                    required: 'Question is required.',
                    minLength: { value: 3, message: 'Question is too short.' },
                  })}
                />
                <Form.Control.Feedback type="invalid">{errors.question?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group controlId="faq-category">
                <Form.Label>Category <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control placeholder="General" {...register('category', { maxLength: 100 })} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="faq-answer">
                <Form.Label>Answer <span className="form-required">*</span></Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  isInvalid={Boolean(errors.answer)}
                  {...register('answer', { required: 'Answer is required.' })}
                />
                <Form.Control.Feedback type="invalid">{errors.answer?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={12}>
              <div className="admin-np-heading">
                <strong>नेपाली (Nepali version)</strong>
                <span className="text-muted small">Shown when the site is in Nepali. Leave empty to show the English text.</span>
              </div>
              <TranslateButton
                getSources={() => [getValues('question') ?? '', getValues('answer') ?? '']}
                getCurrent={() => [getValues('questionNp') ?? '', getValues('answerNp') ?? '']}
                onTranslated={(texts) => {
                    setValue('questionNp', texts[0], { shouldDirty: true })
                    setValue('answerNp', texts[1], { shouldDirty: true })
                }}
              />
            </Col>
            <Col md={12}>
              <Form.Group controlId="faqs-questionNp">
                <Form.Label>प्रश्न (Question in Nepali) <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control lang="ne" {...register('questionNp', { maxLength: 500 })} />
              </Form.Group>
            </Col>
            <Col md={12}>
              <Form.Group controlId="faqs-answerNp">
                <Form.Label>उत्तर (Answer in Nepali) <span className="form-optional">(optional)</span></Form.Label>
                <Form.Control as="textarea" rows={4} lang="ne" {...register('answerNp', { maxLength: 5000 })} />
              </Form.Group>
            </Col>
          </Row>
          <div className="mt-3 d-flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : editing ? 'Save changes' : 'Add question'}
            </Button>
            {editing ? <Button variant="outline-secondary" onClick={() => startEdit(null)}>Cancel</Button> : null}
          </div>
        </Form>
      </div>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorState title="Could not load FAQs" /> : null}
      {!isLoading && !isError && faqs.length === 0 ? (
        <div className="admin-panel"><p className="admin-panel__empty">No questions yet. The home page hides the FAQ section until you add one.</p></div>
      ) : null}

      {faqs.length > 0 ? (
        <Accordion className="faq-accordion admin-faq-list">
          {faqs.map((faq, index) => (
            <Accordion.Item eventKey={String(index)} key={String(faq.id)}>
              <Accordion.Header>
                <span>
                  {faq.question}
                  {faq.category ? <span className="badge-pill badge-pill--soft ms-2">{faq.category}</span> : null}
                </span>
              </Accordion.Header>
              <Accordion.Body>
                <p className="mb-3" style={{ whiteSpace: 'pre-line' }}>{faq.answer}</p>
                <div className="admin-row-actions">
                  <Button size="sm" variant="outline-primary" onClick={() => startEdit(faq)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this question?')) deleteMutation.mutate(faq)
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      ) : null}
    </section>
  )
}
