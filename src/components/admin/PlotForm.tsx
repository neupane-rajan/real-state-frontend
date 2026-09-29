import { useState, type MouseEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Col, Form, Row } from 'react-bootstrap'
import { useForm, useWatch } from 'react-hook-form'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  createPlot,
  deletePlotImage,
  formatNprPrice,
  updatePlot,
  PLOT_STATUSES,
  type Plot,
  type PlotFormPayload,
  type Property,
} from '../../api/properties'
import { translatePlotStatus } from '../../utils/translateHelpers'

const AREA_UNITS = ['aana', 'dhur', 'kattha', 'ropani', 'bigha', 'sq.ft']
const FACINGS = ['North', 'North-East', 'East', 'South-East', 'South', 'South-West', 'West', 'North-West']
const MAX_IMAGE_MB = 10

const toFormValues = (plot: Plot | null): PlotFormPayload => ({
  plotNumber: plot?.plotNumber ?? '',
  area: plot?.area != null ? String(plot.area) : '',
  areaUnit: plot?.areaUnit ?? 'aana',
  status: plot?.status ?? 'AVAILABLE',
  price: plot?.price != null ? String(plot.price) : '',
  facing: plot?.facing ?? '',
  description: plot?.description ?? '',
  layoutX: plot?.layoutX != null ? String(plot.layoutX) : '',
  layoutY: plot?.layoutY != null ? String(plot.layoutY) : '',
})

type PlotFormProps = {
  project: Property
  plot: Plot | null
  onSaved: (message: string) => void
  onCancel: () => void
}

export function PlotForm({ project, plot, onSaved, onCancel }: PlotFormProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(plot)
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<PlotFormPayload>({ defaultValues: toFormValues(plot) })

  const [layoutX, layoutY, priceInput] = useWatch({ control, name: ['layoutX', 'layoutY', 'price'] })
  const parsedPrice = Number(String(priceInput ?? '').replace(/,/g, ''))

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'property', project.id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['property'] }),
    ])

  const saveMutation = useMutation({
    mutationFn: (values: PlotFormPayload) => {
      const payload = { ...values, price: values.price.replace(/,/g, '').trim() }
      return plot ? updatePlot(project.id, plot.id, payload) : createPlot(project.id, payload)
    },
    onSuccess: async (saved) => {
      await invalidate()
      onSaved(isEditing ? `Plot ${saved.plotNumber} was updated.` : `Plot ${saved.plotNumber} was added.`)
    },
    onError: (error) => setServerError(getApiErrorMessage(error, 'The plot could not be saved.')),
  })

  const imageMutation = useMutation({
    mutationFn: (imageId: number) => deletePlotImage(project.id, plot!.id, imageId),
    onSuccess: invalidate,
    onError: (error) => setServerError(getApiErrorMessage(error, 'Could not remove that photo.')),
  })

  // Clicking the site plan sets the plot's position as a percentage of the image size.
  const placeOnPlan = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100
    setValue('layoutX', x.toFixed(2), { shouldDirty: true })
    setValue('layoutY', y.toFixed(2), { shouldDirty: true })
  }

  const isPlaced = layoutX !== '' && layoutY !== ''

  return (
    <Form onSubmit={handleSubmit((values) => { setServerError(null); saveMutation.mutate(values) })} noValidate className="admin-form">
      <div aria-live="assertive">
        {serverError ? <Alert variant="danger" dismissible onClose={() => setServerError(null)}>{serverError}</Alert> : null}
      </div>

      <fieldset className="admin-form__section">
        <legend>Plot details</legend>
        <Row className="g-3">
          <Col sm={6} lg={3}>
            <Form.Group controlId="plot-number">
              <Form.Label>Plot number <span className="form-required">*</span></Form.Label>
              <Form.Control
                placeholder="e.g. A-12"
                isInvalid={Boolean(errors.plotNumber)}
                {...register('plotNumber', {
                  required: 'Plot number is required.',
                  maxLength: { value: 30, message: 'Keep it under 30 characters.' },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.plotNumber?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="plot-status">
              <Form.Label>Status <span className="form-required">*</span></Form.Label>
              <Form.Select {...register('status')}>
                {PLOT_STATUSES.map((status) => (
                  <option key={status} value={status}>{translatePlotStatus(status, 'en')}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="plot-area">
              <Form.Label>Area <span className="form-optional">(optional)</span></Form.Label>
              <Form.Control
                inputMode="decimal"
                placeholder="e.g. 5"
                isInvalid={Boolean(errors.area)}
                {...register('area', {
                  validate: (value) => !value.trim() || (Number(value) > 0 && Number.isFinite(Number(value))) || 'Enter a number greater than 0.',
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.area?.message}</Form.Control.Feedback>
            </Form.Group>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Group controlId="plot-unit">
              <Form.Label>Unit</Form.Label>
              <Form.Control list="plot-unit-options" {...register('areaUnit', { maxLength: 30 })} />
              <datalist id="plot-unit-options">
                {AREA_UNITS.map((unit) => <option key={unit} value={unit} />)}
              </datalist>
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group controlId="plot-price">
              <Form.Label>Price in NPR <span className="form-optional">(optional)</span></Form.Label>
              <Form.Control
                inputMode="numeric"
                placeholder="Leave empty to show “Contact for price”"
                isInvalid={Boolean(errors.price)}
                {...register('price', {
                  validate: (value) => {
                    const cleaned = value.replace(/,/g, '').trim()
                    return !cleaned || Number(cleaned) > 0 || 'Enter numbers only, greater than 0.'
                  },
                })}
              />
              <Form.Control.Feedback type="invalid">{errors.price?.message}</Form.Control.Feedback>
              {parsedPrice > 0 ? <Form.Text>Shown as <strong>{formatNprPrice(parsedPrice)}</strong></Form.Text> : null}
            </Form.Group>
          </Col>
          <Col sm={6}>
            <Form.Group controlId="plot-facing">
              <Form.Label>Facing <span className="form-optional">(optional)</span></Form.Label>
              <Form.Select {...register('facing')}>
                <option value="">Not specified</option>
                {FACINGS.map((facing) => <option key={facing} value={facing}>{facing}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={12}>
            <Form.Group controlId="plot-description">
              <Form.Label>Description <span className="form-optional">(optional)</span></Form.Label>
              <Form.Control as="textarea" rows={3} placeholder="e.g. Corner plot on a 20 ft road" {...register('description', { maxLength: 2000 })} />
            </Form.Group>
          </Col>
        </Row>
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Position on site plan <span className="form-optional">(optional)</span></legend>
        <input type="hidden" {...register('layoutX')} />
        <input type="hidden" {...register('layoutY')} />
        {project.sitePlanUrl ? (
          <>
            <p className="text-muted small mb-2">
              Click the plot’s location on the plan. {isPlaced ? 'Click again to move it.' : 'Unplaced plots still appear in the list.'}
            </p>
            <div
              className="admin-plan-picker"
              onClick={placeOnPlan}
              role="presentation"
            >
              <img src={project.sitePlanUrl} alt="Site plan" />
              {isPlaced ? (
                <span className="admin-plan-picker__pin" style={{ left: `${layoutX}%`, top: `${layoutY}%` }} aria-hidden="true" />
              ) : null}
            </div>
            {isPlaced ? (
              <Button
                size="sm"
                variant="link"
                className="px-0 mt-1"
                onClick={() => {
                  setValue('layoutX', '', { shouldDirty: true })
                  setValue('layoutY', '', { shouldDirty: true })
                }}
              >
                Clear position
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-muted small mb-0">
            No site plan yet. Upload one via <strong>Edit</strong> on the property to place plots visually. Plots are still shown as a grid and list.
          </p>
        )}
      </fieldset>

      <fieldset className="admin-form__section">
        <legend>Photos <span className="form-optional">(optional)</span></legend>
        {plot && plot.images.length > 0 ? (
          <ul className="admin-media-grid mb-3">
            {plot.images.map((image, index) => (
              <li key={image.id}>
                <img src={image.image_url} alt={`Plot photo ${index + 1}`} loading="lazy" />
                <button
                  type="button"
                  className="admin-media-grid__remove"
                  aria-label={`Remove photo ${index + 1}`}
                  disabled={imageMutation.isPending}
                  onClick={() => {
                    if (confirm('Remove this photo?')) imageMutation.mutate(image.id)
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <Form.Group controlId="plot-images">
          <Form.Label>{isEditing ? 'Add more photos' : 'Photos'}</Form.Label>
          <Form.Control
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            isInvalid={Boolean(errors.plotImages)}
            {...register('plotImages', {
              validate: (files) => {
                const list = Array.from(files ?? [])
                if (list.length + (plot?.images.length ?? 0) > 12) return 'A plot can have at most 12 photos.'
                const tooLarge = list.find((file) => file.size > MAX_IMAGE_MB * 1024 * 1024)
                return tooLarge ? `${tooLarge.name} is larger than ${MAX_IMAGE_MB} MB.` : true
              },
            })}
          />
          <Form.Control.Feedback type="invalid">{errors.plotImages?.message}</Form.Control.Feedback>
        </Form.Group>
      </fieldset>

      <div className="admin-form__actions">
        <Button variant="outline-secondary" onClick={onCancel} disabled={saveMutation.isPending}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : isEditing ? 'Save plot' : 'Add plot'}
        </Button>
      </div>
    </Form>
  )
}
