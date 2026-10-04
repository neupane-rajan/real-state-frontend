import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form } from 'react-bootstrap'
import { getApiErrorMessage } from '../../api/axiosInstance'
import { savePlotLayout, type Plot, type PlotLayoutRow } from '../../api/properties'
import { PlotLayoutView } from '../plots/PlotLayoutView'

type PlotLayoutEditorProps = {
  projectId: number
  savedRows: PlotLayoutRow[]
  plots: Plot[] // sorted by plot number
}

// Drops plots that no longer exist, so the editor never shows stale ids.
const cleanRows = (rows: PlotLayoutRow[], plots: Plot[]) => {
  const ids = new Set(plots.map((plot) => plot.id))
  return rows.map((row) => (row.type === 'plots' ? { ...row, plotIds: row.plotIds.filter((id) => ids.has(id)) } : row))
}

// Admin builder: stack plot rows and roads from top to bottom, then save.
export function PlotLayoutEditor({ projectId, savedRows, plots }: PlotLayoutEditorProps) {
  const queryClient = useQueryClient()
  const [rows, setRows] = useState<PlotLayoutRow[]>(() => cleanRows(savedRows, plots))
  const [dirty, setDirty] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)

  const byId = new Map(plots.map((plot) => [plot.id, plot]))
  const placed = new Set(rows.flatMap((row) => (row.type === 'plots' ? row.plotIds : [])))
  const unplaced = plots.filter((plot) => !placed.has(plot.id))

  const update = (next: PlotLayoutRow[]) => {
    setRows(next)
    setDirty(true)
    setMessage(null)
  }
  const changeRow = (index: number, row: PlotLayoutRow) => update(rows.map((item, i) => (i === index ? row : item)))
  const moveRow = (index: number, step: -1 | 1) => {
    const next = [...rows]
    ;[next[index], next[index + step]] = [next[index + step], next[index]]
    update(next)
  }
  const movePlot = (index: number, plotIndex: number, step: -1 | 1) => {
    const row = rows[index]
    if (row.type !== 'plots') return
    const plotIds = [...row.plotIds]
    ;[plotIds[plotIndex], plotIds[plotIndex + step]] = [plotIds[plotIndex + step], plotIds[plotIndex]]
    changeRow(index, { ...row, plotIds })
  }

  // Quick start: half the plots above a road, the rest below it.
  const quickStart = () => {
    const half = Math.ceil(plots.length / 2)
    update([
      { type: 'plots', plotIds: plots.slice(0, half).map((plot) => plot.id) },
      { type: 'road', label: '' },
      { type: 'plots', plotIds: plots.slice(half).map((plot) => plot.id) },
    ])
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      savePlotLayout(projectId, cleanRows(rows, plots).filter((row) => row.type === 'road' || row.plotIds.length > 0)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'property', projectId] }),
        queryClient.invalidateQueries({ queryKey: ['property'] }),
      ])
      setDirty(false)
      setMessage({ type: 'success', text: 'Layout saved. Visitors now see it on the property page.' })
    },
    onError: (error) => setMessage({ type: 'danger', text: getApiErrorMessage(error, 'Could not save the layout.') }),
  })

  const hasPlotsInLayout = placed.size > 0

  return (
    <div className="admin-panel">
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
        <div>
          <h2 className="h6 fw-bold mb-1">Layout: plots and roads</h2>
          <p className="text-muted small mb-0">
            Build the project from top to bottom. Each plot row can have any number of plots — rows always use the full width, so both sides of a road line up.
          </p>
        </div>
        {rows.length > 0 ? (
          <Button size="sm" variant="outline-danger" onClick={() => confirm('Clear the whole layout?') && update([])}>
            Clear layout
          </Button>
        ) : null}
      </div>

      {message ? <Alert variant={message.type} className="py-2 small" dismissible onClose={() => setMessage(null)}>{message.text}</Alert> : null}

      {rows.length === 0 ? (
        <div className="layout-editor__empty">
          <p className="mb-2">No layout yet.</p>
          <div className="d-flex flex-wrap gap-2 justify-content-center">
            {plots.length > 0 ? (
              <Button onClick={quickStart}>Quick start: two rows with a road between</Button>
            ) : null}
            <Button variant="outline-secondary" onClick={() => update([{ type: 'plots', plotIds: [] }])}>Start empty</Button>
          </div>
          {plots.length === 0 ? <p className="small text-muted mt-2 mb-0">Add plots first, then place them here.</p> : null}
        </div>
      ) : (
        <ol className="layout-editor">
          {rows.map((row, index) => (
            <li key={index} className={`layout-editor__row layout-editor__row--${row.type}`}>
              <div className="layout-editor__row-head">
                <strong>{row.type === 'road' ? '🛣️ Road' : `Plot row ${rows.slice(0, index + 1).filter((item) => item.type === 'plots').length}`}</strong>
                <div className="layout-editor__row-actions">
                  <Button size="sm" variant="light" disabled={index === 0} onClick={() => moveRow(index, -1)} aria-label="Move row up">↑</Button>
                  <Button size="sm" variant="light" disabled={index === rows.length - 1} onClick={() => moveRow(index, 1)} aria-label="Move row down">↓</Button>
                  <Button size="sm" variant="light" className="text-danger" onClick={() => update(rows.filter((_, i) => i !== index))} aria-label="Remove row">✕</Button>
                </div>
              </div>

              {row.type === 'road' ? (
                <Form.Control
                  size="sm"
                  placeholder="Road name or width, e.g. 20 ft road (optional)"
                  value={row.label ?? ''}
                  maxLength={60}
                  onChange={(event) => changeRow(index, { ...row, label: event.target.value })}
                  aria-label="Road label"
                />
              ) : (
                <div className="layout-editor__plots">
                  {row.plotIds.map((plotId, plotIndex) => {
                    const plot = byId.get(plotId)
                    if (!plot) return null
                    return (
                      <span key={plotId} className={`layout-chip layout-chip--${plot.status.toLowerCase()}`}>
                        <button type="button" disabled={plotIndex === 0} onClick={() => movePlot(index, plotIndex, -1)} aria-label={`Move ${plot.plotNumber} left`}>‹</button>
                        <strong>{plot.plotNumber}</strong>
                        <button type="button" disabled={plotIndex === row.plotIds.length - 1} onClick={() => movePlot(index, plotIndex, 1)} aria-label={`Move ${plot.plotNumber} right`}>›</button>
                        <button type="button" onClick={() => changeRow(index, { ...row, plotIds: row.plotIds.filter((id) => id !== plotId) })} aria-label={`Remove ${plot.plotNumber} from this row`}>×</button>
                      </span>
                    )
                  })}
                  {unplaced.length > 0 ? (
                    <>
                      <Form.Select
                        size="sm"
                        className="layout-editor__add"
                        value=""
                        aria-label="Add a plot to this row"
                        onChange={(event) => changeRow(index, { ...row, plotIds: [...row.plotIds, Number(event.target.value)] })}
                      >
                        <option value="">+ Add plot…</option>
                        {unplaced.map((plot) => <option key={plot.id} value={plot.id}>{plot.plotNumber}</option>)}
                      </Form.Select>
                      {unplaced.length > 1 ? (
                        <Button size="sm" variant="link" className="p-0" onClick={() => changeRow(index, { ...row, plotIds: [...row.plotIds, ...unplaced.map((plot) => plot.id)] })}>
                          Add all remaining ({unplaced.length})
                        </Button>
                      ) : null}
                    </>
                  ) : row.plotIds.length === 0 ? (
                    <span className="small text-muted">All plots are already placed. Remove one from another row to put it here.</span>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 ? (
        <div className="d-flex flex-wrap gap-2 mt-2">
          <Button size="sm" variant="outline-primary" onClick={() => update([...rows, { type: 'plots', plotIds: [] }])}>+ Plot row</Button>
          <Button size="sm" variant="outline-secondary" onClick={() => update([...rows, { type: 'road', label: '' }])}>+ Road</Button>
        </div>
      ) : null}

      {unplaced.length > 0 && rows.length > 0 ? (
        <p className="small text-muted mt-3 mb-0">
          Not placed yet: {unplaced.map((plot) => plot.plotNumber).join(', ')}. These still show in the Grid and List views.
        </p>
      ) : null}

      {hasPlotsInLayout ? (
        <div className="mt-3">
          <p className="form-label mb-2">Preview</p>
          <PlotLayoutView rows={rows} plots={plots} />
        </div>
      ) : null}

      <div className="layout-editor__save">
        {dirty ? <span className="small text-warning-emphasis">Unsaved changes</span> : null}
        <Button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}>
          {saveMutation.isPending ? 'Saving…' : 'Save layout'}
        </Button>
      </div>
    </div>
  )
}
