import { useEffect, useState } from 'react'
import { Alert, Button, Card, Container, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/axiosInstance'
import type { AdminLoginPayload } from '../../api/auth'
import { companyInfo } from '../../constants/companyInfo'
import { useAuth } from '../../hooks/useAuth'

type LocationState = {
  from?: {
    pathname?: string
    search?: string
  }
}

export function AdminLogin() {
  const { adminLogin, isAdmin, isCheckingSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null
  // Where to go after signing in: the admin page the user originally requested, or the dashboard.
  // Only same-site admin paths; backslashes and "//" are rejected so the redirect can't leave the site.
  const requested = state?.from?.pathname ?? ''
  const isSafeAdminPath = requested.startsWith('/admin') && !requested.includes('\\') && !requested.includes('//')
  const redirectTo = isSafeAdminPath ? requested + (state?.from?.search ?? '') : '/admin'
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginPayload>()

  useEffect(() => {
    document.title = `Admin login | ${companyInfo.nameEn}`
  }, [])

  if (!isCheckingSession && isAdmin) {
    return <Navigate to={redirectTo} replace />
  }

  const onSubmit = async (payload: AdminLoginPayload) => {
    setError(null)

    try {
      await adminLogin(payload)
      navigate(redirectTo, { replace: true })
    } catch (caughtError) {
      setError(getApiErrorMessage(caughtError, 'Admin login failed. Please try again.'))
    }
  }

  return (
    <main className="auth-page">
      <Container>
        <Card className="auth-card mx-auto">
          <Card.Body className="p-4 p-md-5">
            <div className="auth-card__brand">
              <img src="/logo-small.webp" alt="" width={48} height={48} />
              <span>{companyInfo.nameEn}</span>
            </div>
            <h1 className="h3 fw-bold mb-1">Admin login</h1>
            <p className="text-muted mb-4">Sign in to manage properties and website content.</p>
            <div aria-live="assertive">
              {error ? <Alert variant="danger">{error}</Alert> : null}
            </div>
            <Form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Form.Group className="mb-3" controlId="admin-username">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  autoComplete="username"
                  autoFocus
                  isInvalid={Boolean(errors.username)}
                  {...register('username', { required: 'Username is required.' })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.username?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Form.Group className="mb-4" controlId="admin-password">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  autoComplete="current-password"
                  isInvalid={Boolean(errors.password)}
                  {...register('password', { required: 'Password is required.' })}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.password?.message}
                </Form.Control.Feedback>
              </Form.Group>
              <Button type="submit" disabled={isSubmitting} className="w-100">
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </Form>
            <p className="text-center mt-4 mb-0">
              <Link to="/" className="small">← Back to website</Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </main>
  )
}
