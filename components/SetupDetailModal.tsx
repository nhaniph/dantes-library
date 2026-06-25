'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Setup } from './LibraryPage'

type Props = {
  setup: Setup
  allTags: string[]
  onClose: () => void
  onDeleted: () => void
  onUpdated: () => void
}

export default function SetupDetailModal({ setup, onClose, onDeleted }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [activeImg, setActiveImg] = useState<string | null>(
    setup.image_weekly || setup.image_daily || setup.image_hourly || null
  )

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('library_setups').delete().eq('id', setup.id)
    setDeleting(false)
    onDeleted()
  }

  const images = [
    { slot: 'Weekly', url: setup.image_weekly },
    { slot: 'Daily', url: setup.image_daily },
    { slot: 'Hourly', url: setup.image_hourly },
  ].filter(i => i.url)

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: 800 }}>
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: '-0.5px' }}>{setup.symbol}</span>
            {setup.outcome && <span className={`outcome-badge ${setup.outcome}`}>{setup.outcome}</span>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', overflowY: 'auto', maxHeight: '80vh', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Meta row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <MetaItem label="Date" value={setup.date} />
            {setup.time_of_setup && <MetaItem label="Time" value={setup.time_of_setup} />}
            {setup.author && <MetaItem label="Author" value={setup.author} />}
          </div>

          {/* Charts */}
          {images.length > 0 && (
            <div>
              {/* Main viewer */}
              <div style={{ aspectRatio: '16/9', borderRadius: 8, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={activeImg || images[0].url!} alt="chart" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              {/* Thumbnails */}
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {images.map(img => (
                    <div
                      key={img.slot}
                      onClick={() => setActiveImg(img.url!)}
                      style={{
                        flex: 1, aspectRatio: '16/9', borderRadius: 6, overflow: 'hidden',
                        cursor: 'pointer', border: `2px solid ${activeImg === img.url ? 'var(--accent)' : 'var(--border)'}`,
                        position: 'relative'
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url!} alt={img.slot} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 4, left: 6, fontSize: 10, fontWeight: 600, color: 'white', textShadow: '0 1px 3px rgba(0,0,0,0.8)', textTransform: 'uppercase' }}>{img.slot}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Confluence tags */}
          {(setup.confluence_tags || []).length > 0 && (
            <div>
              <SectionLabel>Confluence</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(setup.confluence_tags || []).map(t => (
                  <span key={t} className="tag-pill selected">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Labels */}
          {(setup.labels || []).length > 0 && (
            <div>
              <SectionLabel>Labels</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(setup.labels || []).map(l => (
                  <span key={l} className="label-tag">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Exit criteria */}
          {setup.exit_criteria && (
            <div>
              <SectionLabel>Exit Criteria</SectionLabel>
              <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{setup.exit_criteria}</p>
            </div>
          )}

          {/* Notes */}
          {setup.notes && (
            <div>
              <SectionLabel>Notes</SectionLabel>
              <p style={{ margin: 0, color: 'var(--text)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{setup.notes}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ padding: '7px 14px', borderRadius: 6, border: '1.5px solid var(--loss)', background: 'transparent', color: 'var(--loss)', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}
              >Delete</button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Are you sure?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ padding: '7px 14px', borderRadius: 6, border: 'none', background: 'var(--loss)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                >{deleting ? 'Deleting…' : 'Yes, delete'}</button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  style={{ padding: '7px 14px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13 }}
                >Cancel</button>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ padding: '7px 18px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Close</button>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{children}</div>
}
