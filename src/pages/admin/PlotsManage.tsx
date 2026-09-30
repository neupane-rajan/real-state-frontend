import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form, Modal, Table } from 'react-bootstrap'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  deletePlot,
  formatNprPrice,
  getAdminPropertyById,
  getPlotStats,
  PLOT_STATUSES,
  sortPlots,
  updatePlot,
  type Plot,
  type PlotStatus,
} from '../../api/properties'
import { PlotForm } from '../../components/admin/PlotForm'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { translatePlotStatus } from '../../utils/translateHelpers'

export function PlotsManage() {
  const { propertyId } = useParams()
  const id = Number(propertyId)
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const location = useLocation()
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(() => {
    const text = (location.state as { notice?: string } | null)?.notice
    return text ? { type: 'success', text } : null
  })

  const { data: project, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'property', id],
    queryFn: () => getAdminPropertyById(id),
    enabled: Number.isInteger(id) && id > 0,
  })

  const plots = sortPlots((project?.plots ?? []) as Plot[])
  const stats = getPlotStats(plots)
  const editingPlot = typeof editing === 'number' ? plots.find((plot) => plot.id === editing) ?? null : null

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'property', id] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['property'] }),
    ])

  const statusMutation = useMutation({
    mutationFn: ({ plot, status }: { plot: Plot; status: PlotStatus }) => updatePlot(id, plot.id, { status }),
    onSuccess: async (saved) => {
      await invalidate()
      setNotice({ type: 'success', text: `Plot ${saved.plotNumber} is now ${translatePlotStatus(saved.status, 'en').toLowerCase()}.` })
    },
    onError: (err) => setNotice({ type: 'danger', text: getApiErrorMessage(err, 'Could not change the status.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (plot: Plot) => deletePlot(id, plot.id),
    onSuccess: async (_result, plot) => {
      await invalidate()
      setNotice({ type: 'success', text: `Plot ${plot.plotNumber} was deleted.` })
    },
    onError: (err) => setNotice({ type: 'danger', text: getApiErrorMessage(err, 'Could not delete the plot.') }),
  })

  if (isLoading) return <Loader label="Loading project…" />
  if (isError || !project) {
    return <ErrorState title="Could not load this project" message={getApiErrorMessage(error, 'Please go back and try again.')} />
  }

  if (!project.category?.isPlotProject) {
    return (
      <section>
        <Link to="/admin/properties" className="small">← Back to properties</Link>
        <div className="admin-panel mt-3">
          <p className="admin-panel__empty">
            “{project.title}” is not a Plot Project. Change its property type to manage plots.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section>
      <Link to="/admin/properties" className="small">← Back to properties</Link>
      <div className="admin-page-header mt-2">
        <div>
          <h1 className="admin-page-title">Plots — {project.title}</h1>
          <p className="text-muted mb-0">
            {stats.total} plots · {stats.AVAILABLE} available · {stats.RESERVED} reserved · {stats.SOLD} sold
          </p>
        </div>
        <div className="d-flex gap-2">
          {project.isPublished ? (
            <Link to={`/properties/${project.id}`} target="_blank" className="btn btn-outline-secondary">View on site ↗</Link>
          ) : null}
          <Button onClick={() => setEditing('new')}>+ Add plot</Button>
        </div>
      </div>

      {notice ? <Alert variant={notice.type} dismissible onClose={() => setNotice(null)}>{notice.text}</Alert> : null}

      {project.sitePlanUrl ? (
        <div className="admin-panel">
          <h2 className="h6 fw-bold mb-2">Site plan</h2>
          <p className="text-muted small">Click a plot marker to edit it. Set positions inside each plot’s form.</p>
          <div className="plot-plan__scroller">
            <div className="plot-plan">
              <img src={project.sitePlanUrl} alt="Site plan" />
              {plots
                .filter((plot) => plot.layoutX !== null && plot.layoutY !== null)
                .map((plot) => (
                  <button
                    key={plot.id}
                    type="button"
                    className={`plot-marker plot-marker--${plot.status.toLowerCase()}`}
                    style={{ left: `${plot.layoutX}%`, top: `${plot.layoutY}%` }}
                    onClick={() => setEditing(plot.id)}
                    aria-label={`Edit plot ${plot.plotNumber}`}
                  >
                    {plot.plotNumber}
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <Alert variant="light" className="border">
          No site plan yet — plots will be shown to visitors as a grid. To add one, use <strong>Edit</strong> on this property in the property list.
        </Alert>
      )}

      {plots.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-panel__empty">No plots yet. Click “Add plot” to create the first one.</p>
        </div>
      ) : (
        <div className="admin-panel p-0">
          <Table hover className="admin-table admin-table--stack mb-0">
            <thead>
              <tr>
                <th>Plot</th>
                <th>Area</th>
                <th>Price</th>
                <th>Status</th>
                <th>On plan</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {plots.map((plot) => (
                <tr key={plot.id}>
                  <td data-label="Plot">
                    <strong>{plot.plotNumber}</strong>
                    {plot.facing ? <span className="d-block small text-muted">{plot.facing} facing</span> : null}
                  </td>
                  <td data-label="Area">{plot.area ? `${plot.area} ${plot.areaUnit ?? ''}` : <span className="text-muted">—</span>}</td>
                  <td data-label="Price" className="text-nowrap">{formatNprPrice(plot.price) ?? <span className="text-muted">Not shown</span>}</td>
                  <td data-label="Status">
                    <Form.Select
                      size="sm"
                      value={plot.status}
                      aria-label={`Status of plot ${plot.plotNumber}`}
                      disabled={statusMutation.isPending}
                      onChange={(event) => statusMutation.mutate({ plot, status: event.target.value as PlotStatus })}
                      className={`admin-plot-status admin-plot-status--${plot.status.toLowerCase()}`}
                    >
                      {PLOT_STATUSES.map((status) => (
                        <option key={status} value={status}>{translatePlotStatus(status, 'en')}</option>
                      ))}
                    </Form.Select>
                  </td>
                  <td data-label="On plan">
                    {plot.layoutX !== null ? 'Yes' : <span className="text-muted">No</span>}
                    {plot.images.length > 0 ? <span className="d-block small text-muted">{plot.images.length} photo{plot.images.length > 1 ? 's' : ''}</span> : null}
                  </td>
                  <td className="text-lg-end">
                    <div className="admin-row-actions">
                      <Button size="sm" variant="outline-primary" onClick={() => setEditing(plot.id)}>Edit</Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (confirm(`Delete plot ${plot.plotNumber}? Its photos will also be removed.`)) deleteMutation.mutate(plot)
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
      )}

      <Modal show={editing !== null} onHide={() => setEditing(null)} size="lg" fullscreen="md-down" scrollable backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">{editing === 'new' ? 'Add plot' : `Edit plot ${editingPlot?.plotNumber ?? ''}`}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editing === 'new' || editingPlot ? (
            <PlotForm
              key={editing === 'new' ? 'new' : editingPlot?.id}
              project={project}
              plot={editing === 'new' ? null : editingPlot}
              onCancel={() => setEditing(null)}
              onSaved={(text) => {
                setNotice({ type: 'success', text })
                setEditing(null)
              }}
            />
          ) : null}
        </Modal.Body>
      </Modal>
    </section>
  )
}
