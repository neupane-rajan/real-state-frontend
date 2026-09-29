export function ErrorState({
  title = 'Something went wrong',
  message,
}: {
  title?: string
  message?: string
}) {
  return (
    <div className="state-card state-card--error" role="alert">
      <h2>{title}</h2>
      <p>{message ?? 'Please refresh the page or try again shortly.'}</p>
    </div>
  )
}
