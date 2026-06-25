'use client'

import { Setup } from './LibraryPage'

export default function SetupCard({ setup, onClick }: { setup: Setup; onClick: () => void }) {
  const coverImage = setup.image_weekly || setup.image_daily || setup.image_hourly

  return (
    <div className="setup-card" onClick={onClick}>
      {/* Image */}
      <div style={{ aspectRatio: '16/9', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt={setup.symbol} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 28 }}>
            📈
          </div>
        )}
        {setup.outcome && (
          <span
            className={`outcome-badge ${setup.outcome}`}
            style={{ position: 'absolute', top: 10, right: 10 }}
          >
            {setup.outcome}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>{setup.symbol}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {setup.date} {setup.time_of_setup ? `· ${setup.time_of_setup}` : ''}
          </span>
        </div>

        {setup.author && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>by {setup.author}</div>
        )}

        {/* Tags */}
        {(setup.confluence_tags || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
            {(setup.confluence_tags || []).slice(0, 4).map(t => (
              <span key={t} className="tag-pill" style={{ fontSize: 11, padding: '2px 8px' }}>{t}</span>
            ))}
            {(setup.confluence_tags || []).length > 4 && (
              <span className="tag-pill" style={{ fontSize: 11, padding: '2px 8px' }}>+{(setup.confluence_tags || []).length - 4}</span>
            )}
          </div>
        )}

        {/* Labels */}
        {(setup.labels || []).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(setup.labels || []).map(l => (
              <span key={l} className="label-tag">{l}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
