import { useMemo, useState } from 'react'
import {
  formatShortPrice,
  getLowestAvailablePlotPrice,
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
import { PlotLayoutView } from './PlotLayoutView'
import { localDigits, translateMeasure } from '../../utils/nepali'

type View = 'layout' | 'plan' | 'grid' | 'list'

const plotArea = (plot: Plot, isNp: boolean) =>
  plot.area ? translateMeasure(`${plot.area}${plot.areaUnit ? ` ${plot.areaUnit}` : ''}`, isNp) : ''

// Public view of a land development project: availability summary, site plan / grid / list, plot details.
export function PlotProjectSection({ property }: { property: Property }) {
  const { language } = useLanguage()
  const isNp = language === 'np'
  const hasSitePlan = Boolean(property.sitePlanUrl)
  const layoutRows = property.plotLayout ?? []
  const layoutPlotIds = new Set(layoutRows.flatMap((row) => (row.type === 'plots' ? row.plotIds : [])))
  const hasLayout = (property.plots ?? []).some((plot) => layoutPlotIds.has(plot.id))
  const [view, setView] = useState<View>(hasLayout ? 'layout' : hasSitePlan ? 'plan' : 'grid')
  const [statusFilter, setStatusFilter] = useState<PlotStatus | ''>('')
  const [selectedId, setSelectedId] = useState<number | null>(null)

  const plots = useMemo(() => sortPlots((property.plots ?? []) as Plot[]), [property.plots])
  const stats = getPlotStats(plots)
  const lowest = formatShortPrice(getLowestAvailablePlotPrice(plots), isNp)
  const selected = plots.find((plot) => plot.id === selectedId) ?? null
  const visiblePlots = statusFilter ? plots.filter((plot) => plot.status === statusFilter) : plots
  const placedPlots = plots.filter((plot) => plot.layoutX !== null && plot.layoutY !== null)
  const unplacedCount = hasSitePlan ? plots.length - placedPlots.length : 0
  const notInLayoutCount = plots.filter((plot) => !layoutPlotIds.has(plot.id)).length

  const statusLabel = (status: PlotStatus) => translatePlotStatus(status, language)
  const plotLabel = (plot: Plot) =>
    `${isNp ? 'प्लट' : 'Plot'} ${plot.plotNumber}, ${statusLabel(plot.status)}${plotArea(plot, isNp) ? `, ${plotArea(plot, isNp)}` : ''}`
  const plotPrice = (plot: Plot) =>
    plot.status === 'SOLD' ? null : formatShortPrice(plot.price, isNp) ?? (isNp ? 'सम्पर्क गर्नुहोस्' : 'On request')

  const views: Array<{ key: View; label: string }> = [
    ...(hasLayout ? [{ key: 'layout' as const, label: isNp ? 'नक्सा' : 'Layout' }] : []),
    ...(hasSitePlan ? [{ key: 'plan' as const, label: isNp ? 'साइट प्लान' : 'Site plan' }] : []),
    { key: 'grid', label: isNp ? 'ग्रिड' : 'Grid' },
    { key: 'list', label: isNp ? 'सूची' : 'List' },
  ]

  if (plots.length === 0 && !hasSitePlan) {
    return (
      <section id="plots" className="pd-card pd-anchor" aria-labelledby="pd-plots-heading">
        <h2 id="pd-plots-heading" className="pd-card__title">{isNp ? 'प्लट उपलब्धता' : 'Plot availability'}</h2>
        <p className="text-muted mb-0">
          {isNp ? 'प्लटको विवरण छिट्टै थपिनेछ। जानकारीका लागि सम्पर्क गर्नुहोस्।' : 'Plot details will be added soon. Contact us for information.'}
        </p>
      </section>
    )
  }

  return (
    <section id="plots" className="pd-card pd-anchor plot-project" aria-labelledby="pd-plots-heading">
      <div className="pd-card__head">
        <div>
          <h2 id="pd-plots-heading" className="pd-card__title mb-1">{isNp ? 'प्लट उपलब्धता' : 'Plot availability'}</h2>
          <p className="plot-project__summary">
            {isNp ? `जम्मा ${localDigits(stats.total, true)} प्लट` : `${stats.total} plots in this project`}
            {lowest ? (isNp ? ` · उपलब्ध प्लट ${lowest} देखि` : ` · available from ${lowest}`) : ''}
          </p>
        </div>
      </div>

      {plots.length > 0 ? (
        <>
          {/* Availability counters double as the status filter */}
          <div className="plot-availability" role="group" aria-label={isNp ? 'स्थिति अनुसार फिल्टर' : 'Filter by status'}>
            <button
              type="button"
              className={`plot-stat plot-stat--all ${statusFilter === '' ? 'is-active' : ''}`}
              aria-pressed={statusFilter === ''}
              onClick={() => setStatusFilter('')}
            >
              <strong>{localDigits(stats.total, isNp)}</strong>
              <span>{isNp ? 'सबै प्लट' : 'All plots'}</span>
            </button>
            {PLOT_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={`plot-stat plot-stat--${status.toLowerCase()} ${statusFilter === status ? 'is-active' : ''}`}
                aria-pressed={statusFilter === status}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              >
                <strong>{localDigits(stats[status], isNp)}</strong>
                <span>{statusLabel(status)}</span>
              </button>
            ))}
          </div>
          <div className="plot-meter" aria-hidden="true">
            {PLOT_STATUSES.map((status) =>
              stats[status] > 0 ? (
                <span
                  key={status}
                  className={`plot-meter__part plot-meter__part--${status.toLowerCase()}`}
                  style={{ flexGrow: stats[status] }}
                />
              ) : null,
            )}
          </div>

          <div className="plot-toolbar">
            <div className="plot-view-toggle" role="group" aria-label={isNp ? 'देखाउने तरिका' : 'View'}>
              {views.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={view === item.key ? 'is-active' : ''}
                  aria-pressed={view === item.key}
                  onClick={() => setView(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <ul className="plot-legend" aria-label={isNp ? 'रङको अर्थ' : 'Legend'}>
              {PLOT_STATUSES.map((status) => (
                <li key={status}>
                  <i className={`plot-dot plot-dot--${status.toLowerCase()}`} aria-hidden="true" />
                  {statusLabel(status)}
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}

      {view === 'layout' && hasLayout ? (
        <>
          <PlotLayoutView
            rows={layoutRows}
            plots={plots}
            onSelect={(plot) => setSelectedId(plot.id)}
            selectedId={selectedId}
            isDimmed={(plot) => statusFilter !== '' && plot.status !== statusFilter}
          />
          <p className="plot-plan__hint">
            {isNp ? 'विवरण हेर्न प्लटमा थिच्नुहोस्।' : 'Tap a plot to see its details.'}
            {notInLayoutCount > 0
              ? isNp
                ? ` ${localDigits(notInLayoutCount, true)} प्लट नक्सामा देखाइएको छैन — ग्रिड वा सूचीमा हेर्नुहोस्।`
                : ` ${notInLayoutCount} plot${notInLayoutCount > 1 ? 's are' : ' is'} not shown on the layout — see Grid or List.`
              : ''}
          </p>
        </>
      ) : null}

      {view === 'plan' && hasSitePlan ? (
        <>
          <div className="plot-plan">
            <img src={optimizedImageUrl(property.sitePlanUrl as string, 1600)} alt={isNp ? 'साइट प्लान' : 'Site plan'} />
            {placedPlots.map((plot) => {
              const dimmed = statusFilter !== '' && plot.status !== statusFilter
              return (
                <button
                  key={plot.id}
                  type="button"
                  className={`plot-marker plot-marker--${plot.status.toLowerCase()} ${dimmed ? 'is-dimmed' : ''} ${selectedId === plot.id ? 'is-selected' : ''}`}
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
          <p className="plot-plan__hint">
            {isNp ? 'विवरण हेर्न प्लटमा थिच्नुहोस्।' : 'Tap a plot on the plan to see its details.'}
            {unplacedCount > 0
              ? isNp
                ? ` ${localDigits(unplacedCount, true)} प्लट नक्सामा देखाइएको छैन — ग्रिड वा सूचीमा हेर्नुहोस्।`
                : ` ${unplacedCount} plot${unplacedCount > 1 ? 's are' : ' is'} not marked on the plan — see Grid or List.`
              : ''}
          </p>
        </>
      ) : null}

      {view === 'grid' ? (
        <ul className="plot-tiles">
          {visiblePlots.map((plot) => (
            <li key={plot.id}>
              <button
                type="button"
                className={`plot-tile plot-tile--${plot.status.toLowerCase()}`}
                onClick={() => setSelectedId(plot.id)}
                aria-label={plotLabel(plot)}
              >
                <span className="plot-tile__status">{statusLabel(plot.status)}</span>
                <strong>{plot.plotNumber}</strong>
                {plotArea(plot, isNp) ? <span className="plot-tile__area">{plotArea(plot, isNp)}</span> : null}
                {plotPrice(plot) ? <span className="plot-tile__price">{plotPrice(plot)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {view === 'list' ? (
        <div className="plot-table-wrap">
          <table className="plot-table">
            <thead>
              <tr>
                <th scope="col">{isNp ? 'प्लट' : 'Plot'}</th>
                <th scope="col">{isNp ? 'क्षेत्रफल' : 'Area'}</th>
                <th scope="col">{isNp ? 'मोहडा' : 'Facing'}</th>
                <th scope="col">{isNp ? 'मूल्य' : 'Price'}</th>
                <th scope="col">{isNp ? 'स्थिति' : 'Status'}</th>
                <th scope="col"><span className="visually-hidden">{isNp ? 'विवरण' : 'Details'}</span></th>
              </tr>
            </thead>
            <tbody>
              {visiblePlots.map((plot) => (
                <tr key={plot.id} className={plot.status === 'SOLD' ? 'is-sold' : ''}>
                  <td data-label={isNp ? 'प्लट' : 'Plot'}>
                    <span className="plot-table__plot">
                      {plot.images[0] ? <img src={optimizedImageUrl(plot.images[0].image_url, 120)} alt="" loading="lazy" /> : null}
                      <strong>{plot.plotNumber}</strong>
                    </span>
                  </td>
                  <td data-label={isNp ? 'क्षेत्रफल' : 'Area'}>{plotArea(plot, isNp) || '—'}</td>
                  <td data-label={isNp ? 'मोहडा' : 'Facing'}>{plot.facing ? translateMeasure(plot.facing, isNp) : '—'}</td>
                  <td data-label={isNp ? 'मूल्य' : 'Price'} className="plot-table__price">{plotPrice(plot) ?? '—'}</td>
                  <td data-label={isNp ? 'स्थिति' : 'Status'}>
                    <span className={`plot-status plot-status--${plot.status.toLowerCase()}`}>{statusLabel(plot.status)}</span>
                  </td>
                  <td className="plot-table__action">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedId(plot.id)} aria-label={`${isNp ? 'विवरण' : 'Details'}: ${plotLabel(plot)}`}>
                      {isNp ? 'विवरण' : 'Details'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {(view === 'grid' || view === 'list') && visiblePlots.length === 0 && plots.length > 0 ? (
        <p className="text-muted mt-3 mb-0">{isNp ? 'यो स्थितिमा कुनै प्लट छैन।' : 'No plots with this status.'}</p>
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
