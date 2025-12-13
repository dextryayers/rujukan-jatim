import React, { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'

const FALLBACK_SUMMARY = {
  activeNow: 0,
  today: {
    views: 0,
    uniqueVisitors: 0,
    date: null,
  },
}

export default function VisitorWidget() {
  const { visitorSummary, trackVisitor, refreshVisitorSummary } = useApp()
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    const stored = window.localStorage.getItem('mutu-visitor-widget-collapsed')
    return stored === 'true'
  })

  useEffect(() => {
    window.localStorage.setItem('mutu-visitor-widget-collapsed', String(collapsed))
  }, [collapsed])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      try {
        await trackVisitor()
      } catch (err) {
        console.warn('Track visitor failed', err)
      }
      if (isMounted) {
        refreshVisitorSummary()
      }
    }
    init()

    const interval = setInterval(() => {
      refreshVisitorSummary()
    }, 10000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [trackVisitor, refreshVisitorSummary])

  const summary = useMemo(() => {
    if (!visitorSummary || typeof visitorSummary !== 'object') {
      return FALLBACK_SUMMARY
    }
    return {
      activeNow: Number(visitorSummary.activeNow ?? visitorSummary.active_now ?? 0),
      today: {
        views: Number(visitorSummary.today?.views ?? 0),
        uniqueVisitors: Number(visitorSummary.today?.uniqueVisitors ?? visitorSummary.today?.unique_visitors ?? 0),
        date: visitorSummary.today?.date ?? null,
      },
    }
  }, [visitorSummary])

  const toggleCollapsed = () => setCollapsed(prev => !prev)

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 text-slate-100">
      {collapsed ? (
        <button
          type="button"
          onClick={toggleCollapsed}
          className="group flex items-center gap-3 rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-2 text-xs font-semibold shadow-xl backdrop-blur-md transition hover:bg-slate-800/80"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/70 opacity-75 group-hover:animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          <span className="uppercase tracking-[0.22em] text-[10px] text-slate-300">Aktif</span>
          <span className="text-base font-bold text-white">{summary.activeNow}</span>
        </button>
      ) : (
        <div className="relative w-[260px] max-w-[80vw] overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/95 px-4 py-4 shadow-2xl backdrop-blur-xl">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/60 bg-slate-800/70 text-slate-300 transition hover:text-white"
            aria-label="Minimalkan widget pengunjung"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
            </svg>
          </button>

          <div className="pr-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Pengunjung Aktif</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">{summary.activeNow}</span>
              <span className="text-xs text-slate-300">orang online sekarang</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Kunjungan</p>
              <p className="mt-1 text-xl font-semibold text-primary-300">{summary.today.views}</p>
              <p className="text-[10px] text-slate-500">hari ini</p>
            </div>
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Pengunjung Unik</p>
              <p className="mt-1 text-xl font-semibold text-emerald-300">{summary.today.uniqueVisitors}</p>
              <p className="text-[10px] text-slate-500">hari ini</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-slate-500">
            <span>Realtime 10s</span>
            <span>Auto refresh</span>
          </div>
        </div>
      )}
    </div>
  )
}
