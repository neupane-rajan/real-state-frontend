import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Alert, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  createBanner,
  deleteBanner,
  getBannerImage,
  getBanners,
  updateBanner,
  type Banner,
  type BannerFormPayload,
} from '../../api/banners'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { optimizedImageUrl } from '../../utils/images'

const MAX_IMAGE_MB = 10

export function BannersManage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Banner | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const { data: banners = [], isLoading, isError } = useQuery({ queryKey: ['banners'], queryFn: getBanners })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BannerFormPayload>({ defaultValues: { title: '' } })

  const startEdit = (banner: Banner | null) => {
    setEditing(banner)
    reset({ title: banner?.title ?? '', bannerImage: undefined })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: BannerFormPayload) =>
      editing?.id ? updateBanner(editing.id, payload) : createBanner(payload),
    onSuccess: async () => {
      setNotice({ type: 'success', text: editing ? 'Banner updated.' : 'Banner uploaded. It is now the home page photo.' })
      startEdit(null)
      await queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The banner could not be saved.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (banner: Banner) => deleteBanner(banner.id as number),
    onSuccess: async () => {
      setNotice({ type: 'success', text: 'Banner deleted.' })
      await queryClient.invalidateQueries({ queryKey: ['banners'] })
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'The banner could not be deleted.') }),
  })

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Home banner</h1>
          <p className="text-muted mb-0">
            The newest banner is used as the large photo at the top of the home page.
            With no banners, the default house photo is shown.
          </p>
        </div>
      </div>

      {notice ? <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      <div className="admin-panel">
        <h2 className="h6 fw-bold mb-3">{editing ? `Edit banner: ${editing.title ?? ''}` : 'Upload a new banner'}</h2>
        <Form onSubmit={handleSubmit((payload) => { setNotice(null); saveMutation.mutate(payload) })} noValidate>
          <Form.Group className="mb-3" controlId="banner-title">
            <Form.Label>Label <span className="form-optional">(optional)</span></Form.Label>
            <Form.Control placeholder="e.g. Dashain offer, New plots in Attariya" {...register('title', { maxLength: 200 })} />
            <Form.Text>For your reference only; it is not shown to visitors.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="banner-image">
            <Form.Label>
              Photo {editing ? <span className="form-optional">(optional — leave empty to keep the current photo)</span> : <span className="form-required">*</span>}
            </Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp"
              isInvalid={Boolean(errors.bannerImage)}
              {...register('bannerImage', {
                validate: (files) => {
                  const file = files?.[0]
                  if (!editing && !file) return 'Choose a photo to upload.'
                  if (file && file.size > MAX_IMAGE_MB * 1024 * 1024) return `The photo must be ${MAX_IMAGE_MB} MB or smaller.`
                  return true
                },
              })}
            />
            <Form.Control.Feedback type="invalid">{errors.bannerImage?.message}</Form.Control.Feedback>
            <Form.Text>A wide landscape photo works best (at least 1600 px wide). JPG, PNG or WebP.</Form.Text>
          </Form.Group>
          <div className="d-flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Uploading…' : editing ? 'Save changes' : 'Upload banner'}
            </Button>
            {editing ? <Button variant="outline-secondary" onClick={() => startEdit(null)}>Cancel</Button> : null}
          </div>
        </Form>
      </div>

      {isLoading ? <Loader /> : null}
      {isError ? <ErrorState title="Could not load banners" /> : null}
      {!isLoading && !isError && banners.length === 0 ? (
        <div className="admin-panel"><p className="admin-panel__empty">No banners yet — the home page is using the default photo.</p></div>
      ) : null}

      {banners.length > 0 ? (
        <ul className="admin-banner-list">
          {banners.map((banner, index) => {
            const image = getBannerImage(banner)
            return (
              <li key={String(banner.id)}>
                {image ? <img src={optimizedImageUrl(image, 480)} alt="" loading="lazy" /> : <span className="admin-thumb--empty" />}
                <div className="admin-banner-list__body">
                  <strong>{banner.title || 'Untitled banner'}</strong>
                  {index === 0 ? <span className="status-dot status-dot--on">Showing on home page</span> : <span className="status-dot status-dot--off">Not shown</span>}
                </div>
                <div className="admin-row-actions">
                  <Button size="sm" variant="outline-primary" onClick={() => startEdit(banner)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this banner? The photo will be removed permanently.')) deleteMutation.mutate(banner)
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
