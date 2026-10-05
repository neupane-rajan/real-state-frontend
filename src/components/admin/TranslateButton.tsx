import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'react-bootstrap'
import { getApiErrorMessage } from '../../api/axiosInstance'
import { getTranslateStatus, translateToNepali } from '../../api/translate'

type TranslateButtonProps = {
  // English texts to translate, in the same order as the Nepali fields they fill
  getSources: () => string[]
  // Current Nepali values (used to ask before overwriting)
  getCurrent: () => string[]
  onTranslated: (texts: string[]) => void
}

// "Translate to Nepali" for admin forms. Hidden when the server has no translation key;
// the admin can always type or correct the Nepali text by hand.
export function TranslateButton({ getSources, getCurrent, onTranslated }: TranslateButtonProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const statusQuery = useQuery({ queryKey: ['translate-status'], queryFn: getTranslateStatus, staleTime: 10 * 60 * 1000 })

  if (!statusQuery.data) return null

  const run = async () => {
    setError(null)
    const sources = getSources()
    if (sources.every((text) => !text.trim())) {
      setError('Fill in the English text first.')
      return
    }
    if (getCurrent().some((text) => text.trim()) && !confirm('Replace the Nepali text that is already filled in?')) return
    setBusy(true)
    try {
      onTranslated(await translateToNepali(sources))
    } catch (err) {
      setError(getApiErrorMessage(err, 'Translation failed. Please try again.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="translate-button">
      <Button size="sm" variant="outline-secondary" onClick={run} disabled={busy}>
        {busy ? 'Translating…' : '🌐 Translate to Nepali'}
      </Button>
      {error ? <small className="text-danger">{error}</small> : null}
      {!error ? <small className="text-muted">Check the result — machine translation can make mistakes.</small> : null}
    </span>
  )
}
