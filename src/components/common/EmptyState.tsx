export function EmptyState({
  title,
  message,
}: {
  title: string
  message: string
}) {
  return (
    <div className="state-card">
      <h2>{title}</h2>
      <p>{message}</p>
    </div>
  )
}
