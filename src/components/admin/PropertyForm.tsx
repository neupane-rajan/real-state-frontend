import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  createProperty,
  deletePropertyMedia,
  deleteSitePlan,
  formatNprPrice,
  formatShortPrice,
  updateProperty,
  type Property,
  type PropertyFormPayload,
  type PropertyMediaType,
  type PropertyMeta,
} from '../../api/properties'
import { categoryEmoji } from '../../utils/translateHelpers'
import { TranslateButton } from './TranslateButton'

const MAX_IMAGE_MB = 10
const MAX_VIDEO_MB = 100
const MAX_IMAGES_PER_UPLOAD = 10

const emptyForm: PropertyFormPayload = {
  title: '',
  description: '',
  address: '',
  titleNp: '',
  descriptionNp: '',
  addressNp: '',
  categoryId: '',
  statusId: '',
  price: '',
  bedrooms: '',
  bathrooms: '',
  area: '',
  roadAccess: '',
  locationLink: '',
  isPublished: true,
  isFeatured: false,
  amenityIds: [],
}

const toFormValues = (property: Property | null): PropertyFormPayload =>
  property
    ? {
        title: property.title,
        description: property.description,
        address: property.address,
        titleNp: property.titleNp ?? '',
        descriptionNp: property.descriptionNp ?? '',
        addressNp: property.addressNp ?? '',
        categoryId: String(property.category?.id ?? ''),
        statusId: String(property.status?.id ?? ''),
        price: property.price === null ? '' : String(property.price),
        bedrooms: property.bedrooms === null ? '' : String(property.bedrooms),
        bathrooms: property.bathrooms === null ? '' : String(property.bathrooms),
        area: property.area ?? '',
        roadAccess: property.roadAccess ?? '',
        locationLink: property.locationLink ?? '',
        isPublished: property.isPublished,
        isFeatured: property.isFeatured,
        amenityIds: property.property_amenities.map(({ amenity }) => String(amenity.id)),
      }
    : emptyForm

// Accepts "1450000" or "14,50,000"; returns null for empty/invalid input.
const parsePriceInput = (value: string) => {
  const cleaned = value.replace(/,/g, '').trim()
  if (!cleaned) return null
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : NaN
}

const validateFiles = (maxMb: number, maxCount?: number) => (files?: FileList) => {
  const list = Array.from(files ?? [])
  if (maxCount && list.length > maxCount) return `You can upload up to ${maxCount} files at a time.`
  const tooLarge = list.find((file) => file.size > maxMb * 1024 * 1024)
  return tooLarge ? `${tooLarge.name} is larger than ${maxMb} MB.` : true
}

const typeRank = (name: string) => ({ House: 0, Land: 1 })[name] ?? 2

const typeHint = (category: PropertyMeta['categories'][number]) => {
  if (category.isPlotProject) return 'Land divided into plots — add each plot with its own size, price and status'
  if (category.name === 'Land') return 'One piece of land sold as a whole'
  if (category.name === 'House') return 'A house or building for sale'
  return null
}

const Required = () => <span className="form-required" aria-label="required">*</span>
const Optional = () => <span className="form-optional">(optional)</span>

type PropertyFormProps = {
  property: Property | null
  meta: PropertyMeta
  onSaved: (message: string, saved: Property) => void
  onCancel: () => void
}

export function PropertyForm({ property, meta, onSaved, onCancel }: PropertyFormProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(property)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<PropertyFormPayload>({ defaultValues: toFormValues(property) })

  const priceInput = useWatch({ control, name: 'price' })
  const parsedPrice = parsePriceInput(priceInput ?? '')

  // "Plot Project" types get a site plan field and plot management.
  const categoryId = useWatch({ control, name: 'categoryId' })
  const isPlotType = Boolean(meta.categories.find((category) => String(category.id) === categoryId)?.isPlotProject)
  // House and Land first, plot projects last.
  const typeOptions = [...meta.categories].sort((a, b) => Number(a.isPlotProject) - Number(b.isPlotProject) || typeRank(a.name) - typeRank(b.name))

  const invalidateLists = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['property'] }),
    ])

  const saveMutation = useMutation({
    mutationFn: (values: PropertyFormPayload) => {
      const payload = {
        ...values,
        price: values.price.replace(/,/g, '').trim(),
        // Site plans only apply to plot projects
        sitePlan: isPlotType ? values.sitePlan : undefined,
      }
      return property ? updateProperty(property.id, payload) : createProperty(payload)
    },
    onSuccess: async (saved) => {
      await invalidateLists()
      onSaved(isEditing ? `“${saved.title}” was updated.` : `“${saved.title}” was created.`, saved)
    },
    onError: (error) => setServerError(getApiErrorMessage(error, 'The property could not be saved. Please try again.')),
  })

  const mediaMutation = useMutation({
    mutationFn: ({ type, id }: { type: PropertyMediaType; id: number }) =>
      deletePropertyMedia(property!.id, type, id),
    onSuccess: invalidateLists,
    onError: (error) => setServerError(getApiErrorMessage(error, 'Could not remove that file.')),
  })

  const sitePlanMutation = useMutation({
    mutationFn: () => deleteSitePlan(property!.id),
    onSuccess: invalidateLists,
    onError: (error) => setServerError(getApiErrorMessage(error, 'Could not remove the site plan.')),
  })

  const removeMedia = (type: PropertyMediaType, id: number, label: string) => {
    if (confirm(`Remove this ${label}? This cannot be undone.`)) {
      setServerError(null)
      mediaMutation.mutate({ type, id })
    }
  }

  const onSubmit = (values: PropertyFormPayload) => {
    setServerError(null)
    saveMutation.mutate(values)
  }

  return (
    <Form onSubmit={handleSubmit(onSubmit)} noValidate className="admin-form">
      <div aria-live="assertive">
        {serverError ? <Alert variant="danger" onClose={() => setServerError(null)} dismissible>{serverError}</Alert> : null}
      </div>
      {Object.keys(errors).length > 0 ? (
        <Alert variant="warning">Please fix the highlighted fields below.</Alert>
      ) : null}
      <p className="text-muted small mb-4">Fields marked <span className="form-required">*</span> are required.</p>

      <fieldset className="admin-form__section">
        <legend>Basic information</legend>
        <Row className="g-3">
          <Col md={12}>
            <Form.Group controlId="property-title">
              <Form.Label>Title <Required /></Form.Label>
              <Form.Control
                placeholder="e.g. Modern 3 bedroom house near Dhangadhi"
                isInvalid={Boolean(errors.title)}
                {...register('title', {
                  required: 'Title is required.',
                  minLength: { value: 3, message: 'Title must be at least 3 characters.' },
                  maxLength: { value: 150, message: 'Title must be 150 characters or fewer.' },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={12}>
            <fieldset>
              <legend className="admin-type-legend">Property type <Required /></legend>
              <div className="admin-type-choice">
                {typeOptions.map((item) => (
                  <label key={item.id} className={`admin-type-choice__option ${String(item.id) === categoryId ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      value={String(item.id)}
                      {...register('categoryId', { required: 'Choose a property type.' })}
                    />
                    <span>
                      <strong><span aria-hidden="true">{categoryEmoji(item)}</span> {item.name}</strong>
                      {typeHint(item) ? <small>{typeHint(item)}</small> : null}
                    </span>
                  </label>
                ))}
              </div>
              {errors.categoryId ? <div className="invalid-feedback d-block">{errors.categoryId.message}</div> : null}
              {isPlotType ? (
                <Alert variant="info" className="mt-3 mb-0 small">
                  {property
                    ? <>Add, edit and mark plots on the <Link to={`/admin/properties/${property.id}/plots`}>Plots page</Link>.</>
                    : 'After you save, you will go straight to the Plots page to add each plot (number, size, price and status).'}
                </Alert>
              ) : null}
            </fieldset>
          </Col>
          <Col md={6}>
            <Form.Group controlId="property-status">
              <Form.Label>Status <Required /></Form.Label>
              <Form.Select isInvalid={Boolean(errors.statusId)} {...register('statusId', { required: 'Choose a status.' })}>
                <option value="">Select status…</option>
                {meta.statuses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </Form.Select>
              <Form.Control.Feedback type="invalid">{errors.statusId?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="property-address">
              <Form.Label>Location <Required /></Form.Label>
              <Form.Control
                placeholder="e.g. Dhangadhi-7, Manera, Kailali"
                isInvalid={Boolean(errors.address)}
                {...register('address', {
                  required: 'Location is required.',
                  minLength: { value: 2, message: 'Location is too short.' },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.address?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="property-description">
              <Form.Label>Description <Required /></Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                isInvalid={Boolean(errors.description)}
                {...register('description', {
                  required: 'Description is required.',
                  maxLength: { value: 5000, message: 'Description must be 5000 characters or fewer.' },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.description?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>नेपाली (Nepali version) <Optional /></legend>
        <p className="text-muted small">Shown when visitors switch the site to Nepali. Leave empty to show the English text.</p>
        <TranslateButton
          getSources={() => [getValues('title'), getValues('address'), getValues('description')]}
          getCurrent={() => [getValues('titleNp'), getValues('addressNp'), getValues('descriptionNp')]}
          onTranslated={([titleNp, addressNp, descriptionNp]) => {
            setValue('titleNp', titleNp, { shouldDirty: true })
            setValue('addressNp', addressNp, { shouldDirty: true })
            setValue('descriptionNp', descriptionNp, { shouldDirty: true })
          }}
        />
        <Row className="g-3 mt-0">
          <Col md={12}>
            <Form.Group controlId="property-title-np">
              <Form.Label>शीर्षक (Title in Nepali)</Form.Label>
              <Form.Control lang="ne" maxLength={150} {...register('titleNp')} />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="property-address-np">
              <Form.Label>स्थान (Location in Nepali)</Form.Label>
              <Form.Control lang="ne" maxLength={200} {...register('addressNp')} />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="property-description-np">
              <Form.Label>विवरण (Description in Nepali)</Form.Label>
              <Form.Control as="textarea" rows={5} lang="ne" maxLength={5000} {...register('descriptionNp')} />
            </Form.Group>
          </Col>
        </Row>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Price</legend>
        <Form.Group controlId="property-price">
          <Form.Label>Price in NPR <Optional /></Form.Label>
          <Form.Control
            inputMode="numeric"
            placeholder="e.g. 14500000"
            isInvalid={Boolean(errors.price)}
            aria-describedby="property-price-help"
            {...register('price', {
              validate: (value) => {
                const price = parsePriceInput(value)
                if (price === null) return true
                if (Number.isNaN(price)) return 'Enter numbers only, e.g. 14500000.'
                return price > 0 || 'Price must be greater than 0.'
              },
            })}
          />
          <Form.Control.Feedback type="invalid">{errors.price?.message}</Form.Control.Feedback>
          <Form.Text id="property-price-help" className="d-block">
            {parsedPrice && parsedPrice > 0
              ? <>Shown on the website as <strong>{formatNprPrice(parsedPrice)}</strong> ({formatShortPrice(parsedPrice)}).</>
              : <>Leave empty to hide the price. Visitors will see <strong>“Contact for price”</strong> instead.</>}
          </Form.Text>
        </Form.Group>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Property details <Optional /></legend>
        <Row className="g-3">
          {/* Bedrooms / bathrooms don't apply to a land development project */}
          {!isPlotType ? (
          <>
          <Col sm={6} lg={3}>
            <Form.Group controlId="property-bedrooms">
              <Form.Label>Bedrooms</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={100}
                isInvalid={Boolean(errors.bedrooms)}
                {...register('bedrooms', {
                  validate: (value) => !value || (/^\d+$/.test(value) && Number(value) <= 100) || 'Enter a whole number (0–100).',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.bedrooms?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="property-bathrooms">
              <Form.Label>Bathrooms</Form.Label>
              <Form.Control
                type="number"
                min={0}
                max={100}
                isInvalid={Boolean(errors.bathrooms)}
                {...register('bathrooms', {
                  validate: (value) => !value || (/^\d+$/.test(value) && Number(value) <= 100) || 'Enter a whole number (0–100).',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.bathrooms?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          </>
          ) : null}
          <Col sm={6} lg={3}>
            <Form.Group controlId="property-area">
              <Form.Label>{isPlotType ? 'Total project area' : 'Area / size'}</Form.Label>
              <Form.Control placeholder="e.g. 8.5 aana" {...register('area', { maxLength: 100 })} />
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="property-road">
              <Form.Label>Road access</Form.Label>
              <Form.Control placeholder="e.g. 16 feet" {...register('roadAccess', { maxLength: 100 })} />
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="property-map">
              <Form.Label>Google Maps link</Form.Label>
              <Form.Control
                type="url"
                placeholder="https://maps.google.com/…"
                isInvalid={Boolean(errors.locationLink)}
                {...register('locationLink', {
                  validate: (value) => !value.trim() || /^https?:\/\//i.test(value.trim()) || 'Link must start with https://',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.locationLink?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
        </Row>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Amenities &amp; features <Optional /></legend>
        <div className="admin-checkbox-grid">
          {meta.amenities.map((amenity) => (
            <Form.Check
              key={amenity.id}
              type="checkbox"
              id={`amenity-${amenity.id}`}
              label={amenity.name}
              value={String(amenity.id)}
              {...register('amenityIds')}
            />
          ))}
        </div>
      </fieldset>

      {isPlotType ? (
        <fieldset className="admin-form__section">
          <legend>Site plan <Optional /></legend>
          {property?.sitePlanUrl ? (
            <div className="admin-site-plan">
              <img src={property.sitePlanUrl} alt="Current site plan" loading="lazy" />
              <Button
                size="sm"
                variant="outline-danger"
                disabled={sitePlanMutation.isPending}
                onClick={() => {
                  if (confirm('Remove the site plan? Plot positions are kept and reappear if you upload a new plan.')) {
                    setServerError(null)
                    sitePlanMutation.mutate()
                  }
                }}
              >
                Remove site plan
              </Button>
            </div>
          ) : null}
          <Form.Group controlId="property-site-plan">
            <Form.Label>{property?.sitePlanUrl ? 'Replace site plan' : 'Site plan / layout image'}</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/webp"
              isInvalid={Boolean(errors.sitePlan)}
              {...register('sitePlan', { validate: validateFiles(MAX_IMAGE_MB, 1) })}
            />
            <Form.Control.Feedback type="invalid">{errors.sitePlan?.message}</Form.Control.Feedback>
            <Form.Text>
              A clear top-down drawing of the plots. After saving, use <strong>Plots</strong> in the property list to add plots and mark them on this plan.
            </Form.Text>
          </Form.Group>
        </fieldset>
      ) : null}

      <fieldset className="admin-form__section">
        <legend>Photos, videos &amp; documents</legend>

        {property && property.images.length > 0 ? (
          <div className="mb-3">
            <p className="form-label mb-2">Current photos ({property.images.length})</p>
            <ul className="admin-media-grid">
              {property.images.map((image, index) => (
                <li key={image.id}>
                  <img src={image.image_url} alt={`Photo ${index + 1}`} loading="lazy" />
                  {index === 0 ? <span className="admin-media-grid__badge">Cover</span> : null}
                  <button
                    type="button"
                    className="admin-media-grid__remove"
                    aria-label={`Remove photo ${index + 1}`}
                    disabled={mediaMutation.isPending || property.images.length <= 1}
                    title={property.images.length <= 1 ? 'A property must keep at least one photo' : 'Remove photo'}
                    onClick={() => removeMedia('images', image.id, 'photo')}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Row className="g-3">
          <Col md={12}>
            <Form.Group controlId="property-images">
              <Form.Label>
                {isEditing ? 'Add more photos' : 'Photos'} {isEditing ? <Optional /> : <Required />}
              </Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                isInvalid={Boolean(errors.propertyImages)}
                {...register('propertyImages', {
                  validate: (files) => {
                    if (!isEditing && (!files || files.length === 0)) return 'Add at least one photo.'
                    return validateFiles(MAX_IMAGE_MB, MAX_IMAGES_PER_UPLOAD)(files)
                  },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.propertyImages?.message}</Form.Control.Feedback>
              <Form.Text>JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB each, {MAX_IMAGES_PER_UPLOAD} at a time. The first photo is used as the cover.</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="property-videos">
              <Form.Label>Videos <Optional /></Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="video/mp4,video/webm,video/quicktime"
                isInvalid={Boolean(errors.propertyVideos)}
                {...register('propertyVideos', { validate: validateFiles(MAX_VIDEO_MB, 2) })}
              />
              <Form.Control.Feedback type="invalid">{errors.propertyVideos?.message}</Form.Control.Feedback>
              <Form.Text>MP4 or WebM, up to {MAX_VIDEO_MB} MB.</Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="property-docs">
              <Form.Label>Documents <Optional /></Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="application/pdf,image/jpeg,image/png"
                isInvalid={Boolean(errors.propertyDocs)}
                {...register('propertyDocs', { validate: validateFiles(MAX_IMAGE_MB, 5) })}
              />
              <Form.Control.Feedback type="invalid">{errors.propertyDocs?.message}</Form.Control.Feedback>
              <Form.Text>PDF or images, up to {MAX_IMAGE_MB} MB. Documents are visible to the public.</Form.Text>
            </Form.Group>
          </Col>
        </Row>

        {property && (property.videos.length > 0 || property.documents.length > 0) ? (
          <ul className="admin-file-list">
            {property.videos.map((video, index) => (
              <li key={`v-${video.id}`}>
                <a href={video.video_url} target="_blank" rel="noopener noreferrer">Video {index + 1}</a>
                <Button size="sm" variant="link" className="text-danger" disabled={mediaMutation.isPending} onClick={() => removeMedia('videos', video.id, 'video')}>Remove</Button>
              </li>
            ))}
            {property.documents.map((doc) => (
              <li key={`d-${doc.id}`}>
                <a href={doc.doc_url} target="_blank" rel="noopener noreferrer">{doc.doc_name}</a>
                <Button size="sm" variant="link" className="text-danger" disabled={mediaMutation.isPending} onClick={() => removeMedia('documents', doc.id, 'document')}>Remove</Button>
              </li>
            ))}
          </ul>
        ) : null}
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Visibility</legend>
        <Form.Check
          type="switch"
          id="property-published"
          label="Published — visible on the public website"
          {...register('isPublished')}
        />
        <Form.Check
          type="switch"
          id="property-featured"
          label="Featured — highlighted and shown first on the home page"
          {...register('isFeatured')}
        />
      </fieldset>

      <div className="admin-form__actions">
        <Button variant="outline-secondary" onClick={onCancel} disabled={saveMutation.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending
            ? isEditing ? 'Saving…' : 'Uploading & creating…'
            : isEditing ? 'Save changes' : 'Create property'}
        </Button>
      </div>
    </Form>
  )
}
