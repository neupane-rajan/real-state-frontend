import { useQuery } from '@tanstack/react-query'
import { Table } from 'react-bootstrap'
import { Loader } from '../../components/common/Loader'
import { ErrorState } from '../../components/common/ErrorState'

type ReadOnlyTableProps<T extends { id?: number | string }> = {
  title: string
  description?: string
  emptyText?: string
  queryKey: string[]
  queryFn: () => Promise<T[]>
  columns: Array<{
    label: string
    className?: string
    render: (item: T) => React.ReactNode
  }>
}

export function ReadOnlyTable<T extends { id?: number | string }>({
  title,
  description,
  emptyText = 'Nothing here yet.',
  queryKey,
  queryFn,
  columns,
}: ReadOnlyTableProps<T>) {
  const { data = [], isLoading, isError } = useQuery({ queryKey, queryFn })

  return (
    <section>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{title}</h1>
          {description ? <p className="text-muted mb-0">{description}</p> : null}
        </div>
      </div>
      {isLoading ? <Loader /> : null}
      {isError ? <ErrorState title={`Could not load ${title.toLowerCase()}`} /> : null}
      {!isLoading && !isError && data.length === 0 ? (
        <div className="admin-panel"><p className="admin-panel__empty">{emptyText}</p></div>
      ) : null}
      {!isLoading && !isError && data.length > 0 ? (
        <div className="admin-panel p-0">
          <Table responsive hover className="admin-table mb-0">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.label} className={column.className}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={String(item.id ?? index)}>
                  {columns.map((column) => (
                    <td key={column.label} className={column.className}>{column.render(item)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : null}
    </section>
  )
}
