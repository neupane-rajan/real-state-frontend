import type { ElementType, HTMLAttributes } from 'react'

type AutoTextProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  children: string | null | undefined
}

// Admin-entered text that Google Website Translator may translate (the rest of the site is
// marked translate="no" on <body>). Text that is already Nepali is left alone. The key makes
// React replace the element when the text changes, because the translator swaps out the
// original text node and React would otherwise update a node that is no longer on the page.
export function AutoText({ as: Tag = 'span', children, ...rest }: AutoTextProps) {
  const text = children ?? ''
  const isEnglish = /[A-Za-z]{2,}/.test(text)
  return (
    <Tag key={text} translate={isEnglish ? 'yes' : 'no'} {...rest}>
      {text}
    </Tag>
  )
}
