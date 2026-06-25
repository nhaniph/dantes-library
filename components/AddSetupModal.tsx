'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type Props = {
  allTags: string[]
  onClose: () => void
  onSaved: () => void
}

type ImageSlot = 'weekly' | 'daily' | 'hourly'

export default function AddSetupModal({ allTags, onClose, onSaved }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [timeOfSetup, setTimeOfSetup] = useState('')
  const [symbol, setSymbol] = useState('')
  const [author, setAuthor] = useState('')
  const [confluenceTags, setConfluenceTags] = useState<string[]>([])
  const [outcome, setOutcome] = useState<string>('')
  const [exitCriteria, setExitCriteria] = useState('')
  const [notes, setNotes] = useState('')
  const [images, setImages] = useState<{ weekly: File | null; daily: File | null; hourly: File | null }>({
    weekly: null, daily: null, hourly: null
  })
  const [previews, setPreviews] = useState<{ weekly: string; daily: string; hourly: string }>({
    weekly: '', daily: '', hourly: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState<ImageSlot | null>(null)

  const fileRefs = {
    weekly: useRef<HTMLInputElement>(null),
    daily: useRef<HTMLInputElement>(null),
    hourly: useRef<HTMLInputElement>(null),
  }

  function handleFile(slot: ImageSlot, file: File) {
    setImages(p => ({ ...p, [slot]: file }))
    const url = URL.createObjectURL(file)
    setPreviews(p => ({ ...p, [slot]: url }))
  }

  function toggleTag(tag: string) {
    setConfluenceTags(p => p.includes(tag) ? p.filter(t => t !== tag) : [...p, tag])
  }

  async function uploadImage(slot: ImageSlot, file: File): Promise<string> {
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${slot}.${ext}`
    const { error } = await supabase.storage.from('library-images').upload(path, file)
    if (error) throw error
    const { data } = supabase.storage.from('library-images').getPublicUrl(path)
    return data.publicUrl
  }

  async function handleSave() {
    if (!symbol.trim()) { setError('Symbol is required.'); return }
    if (!date) { setError('Date is required.'); return }
    setSaving(true)
    setError('')
    try {
      const urls: { weekly?: string; daily?: string; hourly?: string } = {}
      for (const slot of ['weekly', 'daily', 'hourly'] as ImageSlot[]) {
        if (images[slot]) urls[slot] = await uploadImage(slot, images[slot]!)
      }

      const { error } = await supabase.from('library_setups').insert({
        date,
        time_of_setup: timeOfSetup || null,
        symbol: symbol.trim().toUpperCase(),
        author: author.trim() || null,
        confluence_tags: confluenceTags,
        labels: [],
        outcome: outcome || null,
        exit_criteria: exitCriteria.trim() || null,
        notes: notes.trim() || null,
        image_weekly: urls.weekly || null,
        image_daily: urls.daily || null,
        image_hourly: urls.hourly || null,
      })
      if (error) throw error
      onSaved()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    } finally {
      setSaving(false)
    }
  }

  const OUTCOMES = [
    { value: 'win', label: '✓ Win' },
    { value: 'loss', label: '✗ Loss' },
    { value: 'breakeven', label: '— Breakeven' },
  ]

  const [focusedSlot, setFocusedSlot] = useState<ImageSlot | null>(null)
  const focusedSlotRef = useRef<ImageSlot | null>(null)
  focusedSlotRef.current = focusedSlot

  const handleGlobalPaste = useCallback((e: ClipboardEvent) => {
    const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'))
    if (!item) return
    const file = item.getAsFile()
    if (!file) return
    // paste into focused slot, or first empty slot
    const target = focusedSlotRef.current
      ?? (['weekly', 'daily', 'hourly'] as ImageSlot[]).find(s => !images[s])
      ?? 'weekly'
    handleFile(target, file)
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [handleGlobalPaste])

  function ImageDropzone({ slot, label }: { slot: ImageSlot; label: string }) {
    const isFocused = focusedSlot === slot
    return (
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div
          className={`dropzone${drag === slot ? ' drag-over' : ''}${isFocused ? ' drag-over' : ''}`}
          tabIndex={0}
          onClick={() => { setFocusedSlot(slot); fileRefs[slot].current?.click() }}
          onFocus={() => setFocusedSlot(slot)}
          onBlur={() => setFocusedSlot(null)}
          onDragOver={e => { e.preventDefault(); setDrag(slot) }}
          onDragLeave={() => setDrag(null)}
          onDrop={e => {
            e.preventDefault(); setDrag(null)
            const file = e.dataTransfer.files[0]
            if (file && file.type.startsWith('image/')) handleFile(slot, file)
          }}
          style={{ outline: 'none' }}
        >
          {previews[slot] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previews[slot]} alt={slot} />
          ) : (
            <>
              <div style={{ fontSize: 24, marginBottom: 6 }}>🖼</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                {isFocused ? 'Ctrl+V to paste · or click to browse' : 'Click to browse · drag · or paste'}
              </div>
            </>
          )}
          {previews[slot] && (
            <button
              onClick={e => { e.stopPropagation(); setImages(p => ({ ...p, [slot]: null })); setPreviews(p => ({ ...p, [slot]: '' })) }}
              style={{
                position: 'absolute', top: 6, right: 6,
                background: 'rgba(0,0,0,0.5)', border: 'none',
                color: 'white', borderRadius: 4, padding: '2px 6px',
                cursor: 'pointer', fontSize: 12, zIndex: 1
              }}
            >✕</button>
          )}
        </div>
        <input ref={fileRefs[slot]} type="file" accept="image/*" style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(slot, f) }} />
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {/* Modal header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' }}>New Setup</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, maxHeight: '80vh', overflowY: 'auto' }}>

          {/* Row: Symbol + Date + Time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Symbol *</label>
              <input className="notion-input" placeholder="e.g. EURUSD" value={symbol} onChange={e => setSymbol(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Date *</label>
              <input className="notion-input" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Time of Setup</label>
              <input className="notion-input" type="time" value={timeOfSetup} onChange={e => setTimeOfSetup(e.target.value)} />
            </div>
          </div>

          {/* Author */}
          <div>
            <label style={labelStyle}>Author</label>
            <input className="notion-input" placeholder="e.g. Noah" value={author} onChange={e => setAuthor(e.target.value)} />
          </div>

          {/* Charts */}
          <div>
            <label style={labelStyle}>Charts</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <ImageDropzone slot="weekly" label="Weekly" />
              <ImageDropzone slot="daily" label="Daily" />
              <ImageDropzone slot="hourly" label="Hourly" />
            </div>
          </div>

          <hr className="divider" />

          {/* Confluence tags */}
          <div>
            <label style={labelStyle}>Confluence</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {allTags.map(tag => (
                <span
                  key={tag}
                  className={`tag-pill ${confluenceTags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {confluenceTags.includes(tag) && <span style={{ fontSize: 10 }}>✓</span>}
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <hr className="divider" />

          {/* Outcome */}
          <div>
            <label style={labelStyle}>Outcome</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {OUTCOMES.map(o => (
                <button
                  key={o.value}
                  className={`outcome-btn ${outcome === o.value ? `active-${o.value}` : ''}`}
                  onClick={() => setOutcome(p => p === o.value ? '' : o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exit Criteria */}
          <div>
            <label style={labelStyle}>Exit Criteria</label>
            <textarea
              className="notion-input"
              placeholder="Describe your exit criteria…"
              value={exitCriteria}
              onChange={e => setExitCriteria(e.target.value)}
              rows={2}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notes</label>
            <textarea
              className="notion-input"
              placeholder="Any additional notes or observations…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {error && <div style={{ color: 'var(--loss)', fontSize: 13, padding: '8px 12px', background: 'var(--loss-bg)', borderRadius: 6 }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1.5px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 6, border: '1.5px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 6, background: saving ? 'var(--text-muted)' : 'var(--text)', color: 'white', border: 'none', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            {saving ? 'Saving…' : 'Save Setup'}
          </button>
        </div>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 8,
}
