import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, Form, Modal, Nav, Table } from 'react-bootstrap'
import { Link, useSearchParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/axiosInstance'
import {
  deleteProperty,
  formatNprPrice,
  getAdminProperties,
  getPropertyMeta,
  updateProperty,
  type Property,
} from '../../api/properties'
import { PropertyForm } from '../../components/admin/PropertyForm'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'
import { optimizedImageUrl } from '../../utils/images'

type View = 'all' | 'published' | 'drafts' | 'featured'

const views: Array<{ key: View; label: string; filter: (property: Property) => boolean }> = [
  { key: 'all', label: 'All', filter: () => true },
  { key: 'published', label: 'Published', filter: (property) => property.isPublished },
  { key: 'drafts', label: 'Drafts', filter: (property) => !property.isPublished },
  { key: 'featured', label: 'Featured', filter: (property) => property.isFeatured },
]

export function PropertiesManage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  // null = modal closed, 'new' = create form, number = id of the property being edited
  const [editing, setEditing] = useState<number | 'new' | null>(() => (searchParams.get('new') ? 'new' : null))

  const view = (searchParams.get('view') as View | null) ?? 'all'
  const propertiesQuery = useQuery({ queryKey: ['admin', 'properties'], queryFn: getAdminProperties })
  const metaQuery = useQuery({ queryKey: ['property-meta'], queryFn: getPropertyMeta, staleTime: 10 * 60 * 1000 })

  const properties = useMemo(() => propertiesQuery.data ?? [], [propertiesQuery.data])
  const editingProperty = typeof editing === 'number' ? properties.find((property) => property.id === editing) ?? null : null

  const visible = useMemo(() => {
    const activeView = views.find((item) => item.key === view) ?? views[0]
    const query = search.trim().toLowerCase()
    return properties
      .filter(activeView.filter)
      .filter((property) => !query || `${property.title} ${property.address}`.toLowerCase().includes(query))
  }, [properties, view, search])

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'properties'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
      queryClient.invalidateQueries({ queryKey: ['property'] }),
    ])

  const toggleMutation = useMutation({
    mutationFn: ({ property, field }: { property: Property; field: 'isPublished' | 'isFeatured' }) =>
      updateProperty(property.id, { [field]: !property[field] }),
    onSuccess: async (saved, { field }) => {
      await invalidate()
      const state = field === 'isPublished'
        ? saved.isPublished ? 'published' : 'moved to drafts'
        : saved.isFeatured ? 'marked as featured' : 'removed from featured'
      setNotice({ type: 'success', text: `“${saved.title}” ${state}.` })
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'Could not update the property.') }),
  })

  const deleteMutation = useMutation({
    mutationFn: (property: Property) => deleteProperty(property.id),
    onSuccess: async (_result, property) => {
      await invalidate()
      setNotice({ type: 'success', text: `“${property.title}” was deleted.` })
    },
    onError: (error) => setNotice({ type: 'danger', text: getApiErrorMessage(error, 'Could not delete the property.') }),
  })

  const closeForm = () => {
    setEditing(null)
    if (searchParams.get('new')) {
      const next = new URLSearchParams(searchParams)
      next.delete('new')
      setSearchParams(next, { replace: true })
    }
  }

  const setView = (nextView: View) => {
    const next = new URLSearchParams(searchParams)
    if (nextView === 'all') next.delete('view')
    else next.set('view', nextView)
    setSearchParams(next, { replace: true })
  }

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Properties</h1>
          <p className="text-muted mb-0">Add, edit and control which listings appear on the website.</p>
        </div>
        <Button onClick={() => setEditing('new')} disabled={!metaQuery.data}>+ Add property</Button>
      </div>

      {notice ? (
        <Alert variant={notice.type} dismissible onClose={() => setNotice(null)} aria-live="polite">
          {notice.text}
        </Alert>
      ) : null}
      {metaQuery.isError ? <Alert variant="danger">Could not load property types and amenities. Refresh the page to try again.</Alert> : null}

      <div className="admin-toolbar">
        <Nav variant="pills" activeKey={view} onSelect={(key) => setView((key as View) ?? 'all')}>
          {views.map((item) => (
            <Nav.Item key={item.key}>
              <Nav.Link eventKey={item.key}>
                {item.label} <span className="admin-toolbar__count">{properties.filter(item.filter).length}</span>
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>
        <Form.Control
          type="search"
          placeholder="Search title or location…"
          aria-label="Search properties"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-toolbar__search"
        />
      </div>

      {propertiesQuery.isLoading ? <Loader label="Loading properties…" /> : null}
      {propertiesQuery.isError ? <ErrorState title="Could not load properties" message={getApiErrorMessage(propertiesQuery.error, 'Please refresh the page.')} /> : null}

      {propertiesQuery.isSuccess && visible.length === 0 ? (
        <div className="admin-panel">
          <p className="admin-panel__empty">
            {properties.length === 0 ? 'No properties yet. Click “Add property” to create your first listing.' : 'No properties match this view.'}
          </p>
        </div>
      ) : null}

      {propertiesQuery.isSuccess && visible.length > 0 ? (
        <div className="admin-panel p-0">
          <Table hover className="admin-table admin-table--stack mb-0">
            <thead>
              <tr>
                <th>Property</th>
                <th>Price</th>
                <th>Published</th>
                <th>Featured</th>
                <th><span className="visually-hidden">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((property) => {
                const cover = property.images[0]?.image_url
                const isToggling = toggleMutation.isPending && toggleMutation.variables?.property.id === property.id
                return (
                  <tr key={property.id}>
                    <td data-label="Property">
                      <div className="admin-property-cell">
                        {cover ? <img src={optimizedImageUrl(cover, 160)} alt="" className="admin-thumb" loading="lazy" /> : <span className="admin-thumb admin-thumb--empty" />}
                        <div>
                          <strong>{property.title}</strong>
                          <span className="d-block small text-muted">
                            {property.category?.name} · {property.status?.name} · {property.address}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Price" className="text-nowrap">
                      {formatNprPrice(property.price) ?? <span className="text-muted">Not shown</span>}
                    </td>
                    <td data-label="Published">
                      <Form.Check
                        type="switch"
                        id={`published-${property.id}`}
                        checked={property.isPublished}
                        disabled={isToggling}
                        onChange={() => toggleMutation.mutate({ property, field: 'isPublished' })}
                        label={<span className="visually-hidden">Published</span>}
                      />
                    </td>
                    <td data-label="Featured">
                      <Form.Check
                        type="switch"
                        id={`featured-${property.id}`}
                        checked={property.isFeatured}
                        disabled={isToggling}
                        onChange={() => toggleMutation.mutate({ property, field: 'isFeatured' })}
                        label={<span className="visually-hidden">Featured</span>}
                      />
                    </td>
                    <td className="text-lg-end">
                      <div className="admin-row-actions">
                        {property.isPublished ? (
                          <Link to={`/properties/${property.id}`} target="_blank" className="btn btn-sm btn-link">View</Link>
                        ) : null}
                        <Button size="sm" variant="outline-primary" onClick={() => setEditing(property.id)} disabled={!metaQuery.data}>
                          Edit
                        </Button>
                        {property.category?.isPlotProject ? (
                          <Link to={`/admin/properties/${property.id}/plots`} className="btn btn-sm btn-primary">
                            Plots ({property.plots?.length ?? 0})
                          </Link>
                        ) : null}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm(`Delete “${property.title}”? Its photos and files will also be removed. This cannot be undone.`)) {
                              deleteMutation.mutate(property)
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : null}

      <Modal show={editing !== null && Boolean(metaQuery.data)} onHide={closeForm} size="xl" fullscreen="lg-down" scrollable backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title as="h2" className="h5">
            {editing === 'new' ? 'Add property' : `Edit: ${editingProperty?.title ?? ''}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {metaQuery.data && (editing === 'new' || editingProperty) ? (
            <PropertyForm
              key={editing === 'new' ? 'new' : editingProperty?.id}
              property={editing === 'new' ? null : editingProperty}
              meta={metaQuery.data}
              onCancel={closeForm}
              onSaved={(text) => {
                setNotice({ type: 'success', text })
                closeForm()
              }}
            />
          ) : null}
        </Modal.Body>
      </Modal>
    </section>
  )
}
