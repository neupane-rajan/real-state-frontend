// Helpers for showing numbers, dates and measurements in Nepali (Devanagari).

const DIGITS = '०१२३४५६७८९'

export const toNepaliDigits = (value: string | number) =>
  String(value).replace(/[0-9]/g, (digit) => DIGITS[Number(digit)])

// Shorthand used in Nepali mode: Devanagari digits, unchanged otherwise.
export const localDigits = (value: string | number, isNp: boolean) => (isNp ? toNepaliDigits(value) : String(value))

const MONTHS_NP = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर']

// "1 October 2026" / "१ अक्टोबर २०२६" (not left to the browser: many lack Nepali locale data).
export const formatDate = (value: string | Date, isNp: boolean, month: 'long' | 'short' = 'long') => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  if (!isNp) return date.toLocaleDateString('en-GB', { day: 'numeric', month, year: 'numeric' })
  return `${toNepaliDigits(date.getDate())} ${MONTHS_NP[date.getMonth()]} ${toNepaliDigits(date.getFullYear())}`
}

// Land units, road words and directions that admins type in English ("8 dhur", "20 ft main road",
// "North-East"). Longer phrases first so "sq.ft" wins over "ft".
const WORDS: Array<[RegExp, string]> = [
  [/\bsq\.?\s?(?:ft|feet)\b/gi, 'वर्ग फिट'],
  [/\bsq\.?\s?m\b/gi, 'वर्ग मिटर'],
  [/\bbigha\b/gi, 'बिघा'],
  [/\bkatt?ha\b/gi, 'कट्ठा'],
  [/\bdhur\b/gi, 'धुर'],
  [/\bropani\b/gi, 'रोपनी'],
  [/\ba?ana\b/gi, 'आना'],
  [/\bpaisa\b/gi, 'पैसा'],
  [/\bdaam\b/gi, 'दाम'],
  [/\b(?:feet|foot|ft)\b\.?/gi, 'फिट'],
  [/\bmain\b/gi, 'मुख्य'],
  [/\broads?\b/gi, 'सडक'],
  [/\bhighway\b/gi, 'राजमार्ग'],
  [/\bfrontage\b/gi, 'मोहडा'],
  [/\bnorth\b/gi, 'उत्तर'],
  [/\bsouth\b/gi, 'दक्षिण'],
  [/\beast\b/gi, 'पूर्व'],
  [/\bwest\b/gi, 'पश्चिम'],
]

export const translateMeasure = (text: string | null | undefined, isNp: boolean) => {
  if (!text) return ''
  if (!isNp) return text
  return toNepaliDigits(WORDS.reduce((result, [pattern, word]) => result.replace(pattern, word), text))
}

// Admin content: the Nepali version when the site is in Nepali and one was entered, else English.
export const localized = (english: string | null | undefined, nepali: string | null | undefined, isNp: boolean) =>
  (isNp && nepali?.trim() ? nepali : english) ?? ''
