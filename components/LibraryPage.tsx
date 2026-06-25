'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import AddSetupModal from './AddSetupModal'
import SetupCard from './SetupCard'
import SetupDetailModal from './SetupDetailModal'

export type Setup = {
  id: string
  created_at: string
  date: string
  time_of_setup: string
  symbol: string
  author: string
  confluence_tags: string[]
  labels: string[]
  outcome: 'win' | 'loss' | 'breakeven' | 'pending' | null
  exit_criteria: string
  notes: string
  image_weekly: string | null
  image_daily: string | null
  image_hourly: string | null
}

const ALL_CONFLUENCE_TAGS = [
  'Inside Week Failure',
  'Inside Day Failure',
  'Bullish Engulfing',
  'Bearish Engulfing',
  'SFP',
  'LLPB',
  'LHPB',
  'Bullish Spike',
  'Bearish Spike',
  'Mean Reversion',
  'Pattern Failure',
  'Equal Lows',
  'Equal Highs',
  'Break & Rounded Retest',
  'Zebra Pattern',
  'Spider Pattern',
  'ATR',
  '0.618 Fib',
  '0.5 Fib',
  '0.382 Fib',
]

const OUTCOMES = ['win', 'loss', 'breakeven'] as const

export default function LibraryPage() {
  const [setups, setSetups] = useState<Setup[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedSetup, setSelectedSetup] = useState<Setup | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterOutcome, setFilterOutcome] = useState<string | null>(null)
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  async function fetchSetups() {
    const { data } = await supabase
      .from('library_setups')
      .select('*')
      .order('date', { ascending: false })
    if (data) setSetups(data)
    setLoading(false)
  }

  useEffect(() => { fetchSetups() }, [])

  const allLabels = Array.from(new Set(setups.flatMap(s => s.labels || [])))

  const filtered = setups.filter(s => {
    if (filterTag && !(s.confluence_tags || []).includes(filterTag)) return false
    if (filterOutcome && s.outcome !== filterOutcome) return false
    if (filterLabel && !(s.labels || []).includes(filterLabel)) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !s.symbol?.toLowerCase().includes(q) &&
        !s.author?.toLowerCase().includes(q) &&
        !(s.confluence_tags || []).some(t => t.toLowerCase().includes(q)) &&
        !(s.labels || []).some(l => l.toLowerCase().includes(q))
      ) return false
    }
    return true
  })

  const activeFilters = [filterTag, filterOutcome, filterLabel].filter(Boolean).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ borderBottom: '1.5px solid var(--border)', padding: '0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--text)' }}>
              📚 Dante&apos;s Library
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{filtered.length} setup{filtered.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setShowAdd(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 7,
                background: 'var(--text)', color: 'white',
                border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Setup
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ borderBottom: '1.5px solid var(--border)', padding: '10px 40px', overflowX: 'auto' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
          {/* Search */}
          <input
            className="notion-input"
            style={{ width: 200, flexShrink: 0 }}
            placeholder="Search symbol, author, tag…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />

          <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />

          {/* Outcome filters */}
          {OUTCOMES.map(o => (
            <button
              key={o}
              className={`filter-btn ${filterOutcome === o ? 'active' : ''}`}
              onClick={() => setFilterOutcome(p => p === o ? null : o)}
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}

          {allLabels.length > 0 && (
            <>
              <div style={{ width: 1, height: 22, background: 'var(--border)', margin: '0 4px', flexShrink: 0 }} />
              {allLabels.map(l => (
                <button
                  key={l}
                  className={`filter-btn ${filterLabel === l ? 'active' : ''}`}
                  onClick={() => setFilterLabel(p => p === l ? null : l)}
                >
                  {l}
                </button>
              ))}
            </>
          )}

          {activeFilters > 0 && (
            <button
              className="filter-btn"
              style={{ color: 'var(--loss)', borderColor: 'var(--loss)', marginLeft: 4 }}
              onClick={() => { setFilterTag(null); setFilterOutcome(null); setFilterLabel(null) }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Tag filter ribbon */}
      <div style={{ padding: '12px 40px', borderBottom: '1.5px solid var(--border)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ALL_CONFLUENCE_TAGS.map(tag => (
            <span
              key={tag}
              className={`tag-pill ${filterTag === tag ? 'selected' : ''}`}
              onClick={() => setFilterTag(p => p === tag ? null : tag)}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px' }}>
        {loading ? (
          <div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: 80 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📖</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              {setups.length === 0 ? 'No setups yet. Add your first one.' : 'No setups match your filters.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {filtered.map(setup => (
              <SetupCard key={setup.id} setup={setup} onClick={() => setSelectedSetup(setup)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddSetupModal
          allTags={ALL_CONFLUENCE_TAGS}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); fetchSetups() }}
        />
      )}

      {selectedSetup && (
        <SetupDetailModal
          setup={selectedSetup}
          allTags={ALL_CONFLUENCE_TAGS}
          onClose={() => setSelectedSetup(null)}
          onDeleted={() => { setSelectedSetup(null); fetchSetups() }}
          onUpdated={() => { setSelectedSetup(null); fetchSetups() }}
        />
      )}
    </div>
  )
}
