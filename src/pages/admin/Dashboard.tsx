import { useQuery } from '@tanstack/react-query'
import { Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { getAdminInquiries } from '../../api/inquiries'
import { formatNprPrice, getAdminProperties } from '../../api/properties'
import { ErrorState } from '../../components/common/ErrorState'
import { Loader } from '../../components/common/Loader'

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

export function Dashboard() {
  const propertiesQuery = useQuery({ queryKey: ['admin', 'properties'], queryFn: getAdminProperties })
  const inquiriesQuery = useQuery({ queryKey: ['admin', 'inquiries'], queryFn: getAdminInquiries })

  const properties = propertiesQuery.data ?? []
  const inquiries = inquiriesQuery.data ?? []
  const published = properties.filter((property) => property.isPublished).length

  const stats = [
    { label: 'Total properties', value: properties.length, to: '/admin/properties' },
    { label: 'Published', value: published, to: '/admin/properties?view=published' },
    { label: 'Drafts', value: properties.length - published, to: '/admin/properties?view=drafts' },
    { label: 'Featured', value: properties.filter((property) => property.isFeatured).length, to: '/admin/properties?view=featured' },
    { label: 'Inquiries', value: inquiries.length, to: '/admin/inquiries' },
  ]

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="text-muted mb-0">Overview of your listings and recent activity.</p>
        </div>
        <Link to="/admin/properties?new=1" className="btn btn-primary">+ Add property</Link>
      </div>

      {propertiesQuery.isLoading ? <Loader label="Loading dashboard…" /> : null}
      {propertiesQuery.isError ? <ErrorState title="Could not load dashboard data" /> : null}

      {propertiesQuery.isSuccess ? (
        <>
          <div className="admin-stats">
            {stats.map((stat) => (
              <Link key={stat.label} to={stat.to} className="admin-stat">
                <span className="admin-stat__label">{stat.label}</span>
                <strong className="admin-stat__value">{stat.value}</strong>
              </Link>
            ))}
          </div>

          <Row className="g-4">
            <Col xl={7}>
              <div className="admin-panel">
                <div className="admin-panel__header">
                  <h2>Recent properties</h2>
                  <Link to="/admin/properties">Manage all</Link>
                </div>
                {properties.length === 0 ? (
                  <p className="admin-panel__empty">
                    No properties yet. <Link to="/admin/properties?new=1">Add your first property</Link>.
                  </p>
                ) : (
                  <Table responsive className="admin-table mb-0">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th>Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {properties.slice(0, 5).map((property) => (
                        <tr key={property.id}>
                          <td className="fw-semibold">{property.title}</td>
                          <td>{formatNprPrice(property.price) ?? <span className="text-muted">Not shown</span>}</td>
                          <td>
                            <span className={`status-dot ${property.isPublished ? 'status-dot--on' : 'status-dot--off'}`}>
                              {property.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </td>
                          <td className="text-nowrap">{formatDate(property.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </div>
            </Col>
            <Col xl={5}>
              <div className="admin-panel">
                <div className="admin-panel__header">
                  <h2>Latest inquiries</h2>
                  <Link to="/admin/inquiries">View all</Link>
                </div>
                {inquiriesQuery.isError ? <p className="admin-panel__empty">Could not load inquiries.</p> : null}
                {inquiriesQuery.isSuccess && inquiries.length === 0 ? (
                  <p className="admin-panel__empty">No inquiries yet.</p>
                ) : null}
                <ul className="admin-inquiry-list">
                  {inquiries.slice(0, 5).map((inquiry) => (
                    <li key={inquiry.id}>
                      <div className="d-flex justify-content-between gap-2">
                        <strong>{inquiry.name}</strong>
                        <span className="text-muted small text-nowrap">{formatDate(inquiry.createdAt)}</span>
                      </div>
                      <a href={`tel:${inquiry.phone}`} className="small">{inquiry.phone}</a>
                      {inquiry.property ? <span className="small text-muted"> · {inquiry.property.title}</span> : null}
                      <p className="admin-inquiry-list__message">{inquiry.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>
          </Row>
        </>
      ) : null}
    </section>
  )
}
