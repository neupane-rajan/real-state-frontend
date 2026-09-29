import { useState } from 'react'
import { Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../api/axiosInstance'
import { submitInquiryRequest } from '../../api/inquiries'
import { useLanguage } from '../../hooks/useLanguage'

type InquiryFormValues = {
  name: string
  phone: string
  email: string
  message: string
}

type InquiryFormProps = {
  // Links the inquiry to a property so the admin sees which listing it is about.
  propertyId?: number
  defaultMessage?: string
  compact?: boolean
}

export function InquiryForm({ propertyId, defaultMessage = '', compact = false }: InquiryFormProps) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [status, setStatus] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const idPrefix = propertyId ? `inquiry-${propertyId}` : 'inquiry'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InquiryFormValues>({
    defaultValues: { name: '', phone: '', email: '', message: defaultMessage },
  })

  const onSubmit = async (values: InquiryFormValues) => {
    setStatus(null)

    try {
      await submitInquiryRequest({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim() || undefined,
        message: values.message.trim(),
        propertyId,
      })
      setStatus({
        type: 'success',
        text: isNp
          ? 'धन्यवाद! तपाईंको सन्देश पठाइयो। हामी छिट्टै सम्पर्क गर्नेछौं।'
          : 'Thank you! Your inquiry has been sent. We will contact you soon.',
      })
      reset({ name: '', phone: '', email: '', message: defaultMessage })
    } catch (error) {
      setStatus({
        type: 'danger',
        text: getApiErrorMessage(
          error,
          isNp ? 'सन्देश पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।' : 'Your inquiry could not be sent. Please try again.',
        ),
      })
    }
  }

  const required = isNp ? 'आवश्यक' : 'required'

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate className="inquiry-form">
      <div aria-live="polite">
        {status ? <Alert variant={status.type} className="mb-3">{status.text}</Alert> : null}
      </div>
      <Row className="g-3">
        <Col md={compact ? 12 : 6}>
          <Form.Group controlId={`${idPrefix}-name`}>
            <Form.Label>
              {isNp ? 'नाम' : 'Name'} <span className="form-required" aria-hidden="true">*</span>
              <span className="visually-hidden"> ({required})</span>
            </Form.Label>
            <Form.Control
              autoComplete="name"
              isInvalid={Boolean(errors.name)}
              aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
              {...register('name', {
                required: isNp ? 'कृपया आफ्नो नाम लेख्नुहोस्।' : 'Please enter your name.',
                minLength: { value: 2, message: isNp ? 'नाम कम्तीमा २ अक्षरको हुनुपर्छ।' : 'Name must be at least 2 characters.' },
              })}
            />
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-name-error`}>
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={compact ? 12 : 6}>
          <Form.Group controlId={`${idPrefix}-phone`}>
            <Form.Label>
              {isNp ? 'फोन नम्बर' : 'Phone number'} <span className="form-required" aria-hidden="true">*</span>
              <span className="visually-hidden"> ({required})</span>
            </Form.Label>
            <Form.Control
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98XXXXXXXX"
              isInvalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? `${idPrefix}-phone-error` : undefined}
              {...register('phone', {
                required: isNp ? 'कृपया फोन नम्बर लेख्नुहोस्।' : 'Please enter your phone number.',
                pattern: {
                  value: /^\+?[0-9][0-9\s-]{6,19}$/,
                  message: isNp ? 'मान्य फोन नम्बर लेख्नुहोस्।' : 'Please enter a valid phone number.',
                },
              })}
            />
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-phone-error`}>
              {errors.phone?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group controlId={`${idPrefix}-email`}>
            <Form.Label>
              {isNp ? 'इमेल' : 'Email'} <span className="form-optional">({isNp ? 'ऐच्छिक' : 'optional'})</span>
            </Form.Label>
            <Form.Control
              type="email"
              autoComplete="email"
              isInvalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${idPrefix}-email-error` : undefined}
              {...register('email', {
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: isNp ? 'मान्य इमेल लेख्नुहोस्।' : 'Please enter a valid email address.',
                },
              })}
            />
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-email-error`}>
              {errors.email?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={12}>
          <Form.Group controlId={`${idPrefix}-message`}>
            <Form.Label>
              {isNp ? 'सन्देश' : 'Message'} <span className="form-required" aria-hidden="true">*</span>
              <span className="visually-hidden"> ({required})</span>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={compact ? 4 : 5}
              isInvalid={Boolean(errors.message)}
              aria-describedby={errors.message ? `${idPrefix}-message-error` : undefined}
              {...register('message', {
                required: isNp ? 'कृपया सन्देश लेख्नुहोस्।' : 'Please enter a message.',
                minLength: { value: 5, message: isNp ? 'सन्देश कम्तीमा ५ अक्षरको हुनुपर्छ।' : 'Message must be at least 5 characters.' },
                maxLength: { value: 2000, message: isNp ? 'सन्देश धेरै लामो भयो।' : 'Message is too long (max 2000 characters).' },
              })}
            />
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-message-error`}>
              {errors.message?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>
      <Button type="submit" className="mt-4 w-100 w-md-auto" disabled={isSubmitting}>
        {isSubmitting
          ? isNp ? 'पठाउँदै…' : 'Sending…'
          : isNp ? 'सन्देश पठाउनुहोस्' : 'Send inquiry'}
      </Button>
    </Form>
  )
}
