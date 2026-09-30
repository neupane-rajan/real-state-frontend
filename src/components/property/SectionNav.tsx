import { useEffect, useState } from 'react'

type Section = { id: string; label: string }

// Sticky in-page tabs (Overview, Description, …) that highlight the section being read.
export function SectionNav({ sections, label }: { sections: Section[]; label: string }) {
  const [activeId, setActiveId] = useState(sections[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      // A section counts as "current" when it crosses the upper part of the screen.
      { rootMargin: '-30% 0px -60% 0px' },
    )
    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [sections])

  if (sections.length < 2) return null

  return (
    <nav className="pd-tabs" aria-label={label}>
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={activeId === section.id ? 'is-active' : ''}
          aria-current={activeId === section.id ? 'location' : undefined}
          onClick={() => setActiveId(section.id)}
        >
          {section.label}
        </a>
      ))}
    </nav>
  )
}
