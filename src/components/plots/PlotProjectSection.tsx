import { useMemo, useState } from 'react'
import {
  formatShortPrice,
  getPlotStats,
  PLOT_STATUSES,
  sortPlots,
  type Plot,
  type PlotStatus,
  type Property,
} from '../../api/properties'
import { useLanguage } from '../../hooks/useLanguage'
import { optimizedImageUrl } from '../../utils/images'
import { translatePlotStatus } from '../../utils/translateHelpers'
import { PlotDetailModal } from './PlotDetailModal'

type View = 'layout' | 'list'

const plotArea = (plot: Plot) => (plot.area ? `${plot.area}${plot.areaUnit ? ` ${plot.areaUnit}` : ''}` : '')

// Public view of a land development project: site plan / tile layout, list, and plot details.
export function PlotProjectSection({ property }: { property: Property }) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const [view, setView] = useState<View>('layout')
  const [statusFilter, setStatusFilter] = useState<PlotStatus | ''>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const plots = useMemo(() => sortPlots((property.plots ?? []) as Plot[]), [property.plots])
  const stats = getPlotStats(plots)
  const selected = plots.find((plot) => plot.id === selectedId) ?? null
  const visiblePlots = statusFilter ? plots.filter((plot) => plot.status === statusFilter) : plots

  const hasSitePlan = Boolean(property.sitePlanUrl)
  const placedPlots = plots.filter((plot) => plot.layoutX !== null && plot.layoutY !== null)
  const unplacedCount = hasSitePlan ? plots.length - placedPlots.length : 0

  const plotLabel = (plot: Plot) =>
    `${isNp ? 'प्लट' : 'Plot'} ${plot.plotNumber}, ${translatePlotStatus(plot.status, language)}${plotArea(plot) ? `, ${plotArea(plot)}` : ''}`

  if (plots.length === 0 && !hasSitePlan) {
    return (
      <section className="pd-section" aria-labelledby="pd-plots-heading">
        <h2 id="pd-plots-heading" className="pd-section__title">{isNp ? 'प्लटहरू' : 'Plots'}</h2>
        <p className="text-muted mb-0">
          {isNp ? 'प्लटको विवरण छिट्टै थपिनेछ। जानकारीका लागि सम्पर्क गर्नुहोस्।' : 'Plot details will be added soon. Contact us for information.'}
        </p>
      </section>
    )
  }

  return (
    <section className="pd-section plot-project" aria-labelledby="pd-plots-heading">
      <div className="plot-project__header">
        <div>
          <h2 id="pd-plots-heading" className="pd-section__title mb-1">{isNp ? 'प्लटहरू' : 'Plots'}</h2>
          <p className="plot-project__summary">
            {isNp
              ? `जम्मा ${stats.total} प्लट · ${stats.AVAILABLE} उपलब्ध`
              : `${stats.total} plots · ${stats.AVAILABLE} available`}
          </p>
        </div>
        {plots.length > 0 ? (
          <div className="plot-view-toggle" role="group" aria-label={isNp ? 'देखाउने तरिका' : 'View'}>
            <button type="button" className={view === 'layout' ? 'is-active' : ''} aria-pressed={view === 'layout'} onClick={() => setView('layout')}>
              {isNp ? 'लेआउट' : 'Layout'}
            </button>
            <button type="button" className={view === 'list' ? 'is-active' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')}>
              {isNp ? 'सूची' : 'List'}
            </button>
          </div>
        ) : null}
      </div>

      {plots.length > 0 ? (
        <div className="plot-filters" role="group" aria-label={isNp ? 'स्थिति अनुसार' : 'Filter by status'}>
          <button type="button" className={`pf-chip ${statusFilter === '' ? 'is-active' : ''}`} aria-pressed={statusFilter === ''} onClick={() => setStatusFilter('')}>
            {isNp ? 'सबै' : 'All'} <span>{stats.total}</span>
          </button>
          {PLOT_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={`pf-chip ${statusFilter === status ? 'is-active' : ''}`}
              aria-pressed={statusFilter === status}
              onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
            >
              <i className={`plot-dot plot-dot--${status.toLowerCase()}`} aria-hidden="true" />
              {translatePlotStatus(status, language)} <span>{stats[status]}</span>
            </button>
          ))}
        </div>
      ) : null}

      {view === 'layout' ? (
        hasSitePlan ? (
          <>
            <div className="plot-plan__scroller">
              <div className="plot-plan">
                <img src={optimizedImageUrl(property.sitePlanUrl as string, 1600)} alt={isNp ? 'साइट प्लान' : 'Site plan'} />
                {placedPlots.map((plot) => {
                  const dimmed = statusFilter !== '' && plot.status !== statusFilter
                  return (
                    <button
                      key={plot.id}
                      type="button"
                      className={`plot-marker plot-marker--${plot.status.toLowerCase()} ${dimmed ? 'is-dimmed' : ''}`}
                      style={{ left: `${plot.layoutX}%`, top: `${plot.layoutY}%` }}
                      onClick={() => setSelectedId(plot.id)}
                      aria-label={plotLabel(plot)}
                      title={plotLabel(plot)}
                    >
                      {plot.plotNumber}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="plot-plan__hint">
              {isNp ? 'विवरण हेर्न प्लटमा थिच्नुहोस्।' : 'Tap a plot to see its details.'}
              {unplacedCount > 0
                ? isNp
                  ? ` ${unplacedCount} प्लट नक्सामा देखाइएको छैन — सूचीमा हेर्नुहोस्।`
                  : ` ${unplacedCount} plot${unplacedCount > 1 ? 's are' : ' is'} not marked on the plan — see the list.`
                : ''}
            </p>
          </>
        ) : (
          <ul className="plot-tiles">
            {visiblePlots.map((plot) => (
              <li key={plot.id}>
                <button
                  type="button"
                  className={`plot-tile plot-tile--${plot.status.toLowerCase()}`}
                  onClick={() => setSelectedId(plot.id)}
                  aria-label={plotLabel(plot)}
                >
                  <strong>{plot.plotNumber}</strong>
                  {plotArea(plot) ? <span>{plotArea(plot)}</span> : null}
                  <small>{translatePlotStatus(plot.status, language)}</small>
                </button>
              </li>
            ))}
          </ul>
        )
      ) : (
        <ul className="plot-list">
          {visiblePlots.map((plot) => {
            const price = plot.status === 'SOLD' ? null : formatShortPrice(plot.price, isNp)
            return (
              <li key={plot.id}>
                <button type="button" onClick={() => setSelectedId(plot.id)} aria-label={plotLabel(plot)}>
                  {plot.images[0] ? (
                    <img src={optimizedImageUrl(plot.images[0].image_url, 160)} alt="" loading="lazy" />
                  ) : (
                    <span className="plot-list__thumb" aria-hidden="true">{plot.plotNumber}</span>
                  )}
                  <span className="plot-list__main">
                    <strong>{isNp ? 'प्लट' : 'Plot'} {plot.plotNumber}</strong>
                    <span>{[plotArea(plot), plot.facing].filter(Boolean).join(' · ')}</span>
                  </span>
                  <span className="plot-list__side">
                    <span className={`plot-status plot-status--${plot.status.toLowerCase()}`}>
                      {translatePlotStatus(plot.status, language)}
                    </span>
                    {price ? <span className="plot-list__price">{price}</span> : null}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {visiblePlots.length === 0 && plots.length > 0 && (view === 'list' || !hasSitePlan) ? (
        <p className="text-muted">{isNp ? 'यो स्थितिमा कुनै प्लट छैन।' : 'No plots with this status.'}</p>
      ) : null}

      <PlotDetailModal
        project={property}
        plot={selected}
        onClose={() => setSelectedId(null)}
        onShowAvailable={() => {
          setSelectedId(null)
          setStatusFilter('AVAILABLE')
        }}
      />
    </section>
  )
}
