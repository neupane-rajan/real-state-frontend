import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { deleteInquiry, getAdminInquiries, type Inquiry } from '../../api/inquiries'
import { ReadOnlyTable } from './ReadOnlyTable'

function DeleteInquiryButton({ inquiry }: { inquiry: Inquiry }) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => deleteInquiry(inquiry.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'inquiries'] }),
    onError: () => alert('Could not delete this inquiry. Please try again.'),
  })

  return (
    <Button
      size="sm"
      variant="outline-danger"
      disabled={mutation.isPending}
      onClick={() => {
        if (confirm(`Delete the inquiry from ${inquiry.name}?`)) mutation.mutate()
      }}
    >
      {mutation.isPending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}

export function Inquiries() {
  return (
    <ReadOnlyTable<Inquiry>
      title="Inquiries"
      description="Messages sent from the contact form and property pages."
      emptyText="No inquiries yet. Messages from visitors will appear here."
      queryKey={['admin', 'inquiries']}
      queryFn={getAdminInquiries}
      columns={[
        {
          label: 'Received',
          className: 'text-nowrap',
          render: (item) => new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }),
        },
        { label: 'Name', render: (item) => <strong>{item.name}</strong> },
        {
          label: 'Contact',
          render: (item) => (
            <div className="d-grid">
              <a href={`tel:${item.phone}`}>{item.phone}</a>
              {item.email ? <a href={`mailto:${item.email}`} className="small">{item.email}</a> : null}
            </div>
          ),
        },
        {
          label: 'Property',
          render: (item) =>
            item.property ? (
              <Link to={`/properties/${item.property.id}`} target="_blank">{item.property.title}</Link>
            ) : (
              <span className="text-muted">General</span>
            ),
        },
        { label: 'Message', className: 'admin-table__message', render: (item) => item.message },
        { label: '', className: 'text-end', render: (item) => <DeleteInquiryButton inquiry={item} /> },
      ]}
    />
  )
}
