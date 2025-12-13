import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as API from '../services/api'
import ChartEditor from '../components/ChartEditor'
import DataManager from '../components/DataManager'
import UserManagement from '../components/UserManagement'
import { useNavigate } from 'react-router-dom'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const TONE_CLASSES = {
  primary: 'border-primary-200/60 bg-primary-50/80 text-primary-800 dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100',
  emerald: 'border-emerald-200/60 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100',
  amber: 'border-amber-200/60 bg-amber-50/80 text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100',
  sky: 'border-sky-200/60 bg-sky-50/80 text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-sky-100',
  slate: 'border-slate-200/60 bg-white/90 text-slate-700 dark:border-slate-700/50 dark:bg-slate-900/60 dark:text-slate-100',
}

function showAlert(icon, title, text) {
  if (window.Swal) {
    window.Swal.fire({ icon, title, text })
  } else {
    alert(`${title}\n${text || ''}`)
  }
}

async function confirmLogout() {
  if (window.Swal) {
    const result = await window.Swal.fire({
      icon: 'question',
      title: 'Keluar dari Dashboard?',
      text: 'Anda akan keluar dari sesi admin saat ini.',
      showCancelButton: true,
      confirmButtonText: 'Ya, logout',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    })
    return result.isConfirmed
  }
  return window.confirm('Keluar dari dashboard?')
}

function useAnimatedNumber(target, duration = 800) {
  const [value, setValue] = useState(target)
  const rafRef = useRef(null)
  const startValueRef = useRef(target)
  const startTimeRef = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(target)
      return undefined
    }

    startValueRef.current = value
    startTimeRef.current = null

    const easeOutCubic = t => 1 - Math.pow(1 - t, 3)

    const step = timestamp => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const eased = easeOutCubic(progress)
      const nextValue = startValueRef.current + (target - startValueRef.current) * eased
      setValue(nextValue)
      if (progress < 1) {
        rafRef.current = window.requestAnimationFrame(step)
      }
    }

    rafRef.current = window.requestAnimationFrame(step)

    return () => {
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration])

  useEffect(() => () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return Math.round(value)
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function AdminDashboard() {
  const {
    data,
    logout,
    user,
    updateProfile,
    visitorSummary,
    visitorStats,
    activityLogs,
    refreshVisitorSummary,
    fetchVisitorStats,
    fetchActivityLogs,
    uploadProfilePhoto,
  } = useApp()
  const [tab, setTab] = useState('charts')
  const [rekapSection, setRekapSection] = useState('akreditasi')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const navigate = useNavigate()

  const handleRefresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setRefreshing(true)
    }
    try {
      await Promise.all([
        refreshVisitorSummary(),
        fetchVisitorStats(30),
        fetchActivityLogs(15),
      ])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat data realtime dashboard', error)
      if (!silent) {
        showAlert('error', 'Gagal memuat data', 'Tidak dapat memperbarui data realtime saat ini. Coba lagi beberapa saat.')
      }
    } finally {
      if (!silent) {
        setRefreshing(false)
      }
    }
  }, [refreshVisitorSummary, fetchVisitorStats, fetchActivityLogs])

  useEffect(() => {
    handleRefresh()
  }, [handleRefresh])

  useEffect(() => {
    if (tab !== 'charts' || !autoRefresh) return undefined
    const interval = setInterval(() => {
      handleRefresh({ silent: true })
    }, 15000)
    return () => clearInterval(interval)
  }, [tab, autoRefresh, handleRefresh])

  const lineChartData = useMemo(() => {
    const labels = visitorStats.map(item => new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }))
    const viewsDataset = visitorStats.map(item => item.views)
    const uniqueDataset = visitorStats.map(item => item.uniqueVisitors)

    return {
      labels,
      datasets: [
        {
          label: 'Kunjungan',
          data: viewsDataset,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37,99,235,0.25)',
          fill: true,
          tension: 0.35,
        },
        {
          label: 'Pengunjung Unik',
          data: uniqueDataset,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16,185,129,0.25)',
          fill: true,
          tension: 0.35,
        },
      ],
    }
  }, [visitorStats])

  const lineChartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#e2e8f0',
        },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label}: ${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(148,163,184,0.15)',
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: 'rgba(148,163,184,0.1)',
        },
      },
    },
  }), [])

  const latestLogs = useMemo(() => activityLogs.slice(0, 6), [activityLogs])

  const summary = visitorSummary ?? {
    activeNow: 0,
    today: { views: 0, uniqueVisitors: 0, date: null },
  }

  const numberFormatter = useMemo(() => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }), [])
  const integerFormatter = useMemo(() => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }), [])

  const rekapAkreditasi = useMemo(() => {
    const values = [
      { key: 'paripurna', label: 'Paripurna', value: Number(data?.akreditasi?.paripurna ?? 0) },
      { key: 'utama', label: 'Utama', value: Number(data?.akreditasi?.utama ?? 0) },
      { key: 'madya', label: 'Madya', value: Number(data?.akreditasi?.madya ?? 0) },
    ]

    const formatPercent = val => `${numberFormatter.format(val)}%`
    const average = values.length ? values.reduce((sum, item) => sum + item.value, 0) / values.length : 0
    const gap = Math.max(0, 100 - average)
    const best = values.reduce((acc, curr) => (curr.value > acc.value ? curr : acc), values[0])

    const rows = [
      {
        key: 'paripurna',
        label: 'Paripurna (%)',
        formula: '=Paripurna',
        valueDisplay: formatPercent(values[0].value),
        note: 'Input dari modul Chart Editor',
      },
      {
        key: 'utama',
        label: 'Utama (%)',
        formula: '=Utama',
        valueDisplay: formatPercent(values[1].value),
        note: 'Input dari modul Chart Editor',
      },
      {
        key: 'madya',
        label: 'Madya (%)',
        formula: '=Madya',
        valueDisplay: formatPercent(values[2].value),
        note: 'Input dari modul Chart Editor',
      },
      {
        key: 'average',
        label: 'Rata-rata capaian',
        formula: '=AVERAGE(Paripurna:Madya)',
        valueDisplay: formatPercent(average),
        note: 'Nilai rata-rata dari tiga level akreditasi',
      },
      {
        key: 'gap',
        label: 'Gap ke target 100%',
        formula: '=MAX(0,100-AVERAGE(Paripurna:Madya))',
        valueDisplay: formatPercent(gap),
        note: gap > 0 ? 'Persentase yang masih perlu ditingkatkan' : 'Target maksimum tercapai',
      },
      {
        key: 'highest',
        label: 'Level tertinggi',
        formula: '=INDEX({"Paripurna","Utama","Madya"},MATCH(MAX(Paripurna:Madya),Paripurna:Madya,0))',
        valueDisplay: `${best?.label || '-'} (${formatPercent(best?.value ?? 0)})`,
        note: 'Level akreditasi dengan capaian paling tinggi',
      },
    ]

    return {
      rows,
      average,
      averageDisplay: formatPercent(average),
      gap,
      gapDisplay: formatPercent(gap),
      bestLabel: best?.label ?? '-',
      bestValue: best?.value ?? 0,
      bestDisplay: `${best?.label || '-'} (${formatPercent(best?.value ?? 0)})`,
    }
  }, [data?.akreditasi?.paripurna, data?.akreditasi?.utama, data?.akreditasi?.madya, numberFormatter])

  const rekapIndikator = useMemo(() => {
    const items = Array.isArray(data?.indikators) ? data.indikators : []
    const total = items.length
    const achieved = items.filter(item => item?.status === 'Mencapai Target').length
    const sumCapaian = items.reduce((sum, item) => sum + Number(item?.capaian ?? 0), 0)
    const sumTarget = items.reduce((sum, item) => sum + Number(item?.target ?? 0), 0)
    const completionRate = total ? (achieved / total) * 100 : 0
    const progressCombined = sumTarget > 0 ? (sumCapaian / sumTarget) * 100 : 0
    const averageCapaian = total ? sumCapaian / total : 0
    const gapSum = items.reduce((sum, item) => sum + Math.max(0, Number(item?.target ?? 0) - Number(item?.capaian ?? 0)), 0)
    const averageGap = total ? gapSum / total : 0
    const filledCapaian = items.filter(item => item?.capaian !== null && item?.capaian !== undefined && item?.capaian !== '').length
    const coverage = total ? (filledCapaian / total) * 100 : 0

    const formatPercent = val => `${numberFormatter.format(val)}%`

    const rows = [
      {
        key: 'total',
        label: 'Total indikator aktif',
        formula: '=COUNTA(Indikator[Nama])',
        valueDisplay: integerFormatter.format(total),
        note: 'Jumlah baris data indikator yang tersedia',
      },
      {
        key: 'achieved',
        label: 'Sudah mencapai target',
        formula: '=COUNTIF(Indikator[Status],"Mencapai Target")',
        valueDisplay: `${integerFormatter.format(achieved)} dari ${integerFormatter.format(total)}`,
        note: 'Indikator yang statusnya "Mencapai Target"',
      },
      {
        key: 'completion',
        label: 'Persentase tercapai',
        formula: '=ROUND(COUNTIF(Indikator[Status],"Mencapai Target")/COUNTA(Indikator[Nama])*100,2)&"%"',
        valueDisplay: formatPercent(completionRate),
        note: 'Proporsi indikator yang sudah mencapai target',
      },
      {
        key: 'progress',
        label: 'Progress gabungan',
        formula: '=ROUND(SUM(Indikator[Capaian])/SUM(Indikator[Target])*100,2)&"%"',
        valueDisplay: formatPercent(progressCombined),
        note: sumTarget > 0 ? 'Akumulasi capaian dibanding total target' : 'Isi target untuk mendapatkan progres',
      },
      {
        key: 'averageCapaian',
        label: 'Rata-rata capaian',
        formula: '=AVERAGE(Indikator[Capaian])',
        valueDisplay: formatPercent(averageCapaian),
        note: 'Nilai capaian rata-rata antar indikator',
      },
      {
        key: 'averageGap',
        label: 'Rata-rata gap ke target',
        formula: '=AVERAGE(IF(Indikator[Target]>Indikator[Capaian],Indikator[Target]-Indikator[Capaian],0))',
        valueDisplay: formatPercent(averageGap),
        note: 'Selisih rata-rata menuju target (gunakan Ctrl+Shift+Enter di Excel)',
      },
      {
        key: 'coverage',
        label: 'Persentase data terisi',
        formula: '=ROUND(COUNTA(Indikator[Capaian])/COUNTA(Indikator[Nama])*100,2)&"%"',
        valueDisplay: formatPercent(coverage),
        note: 'Kelengkapan kolom capaian pada seluruh indikator',
      },
    ]

    return {
      rows,
      total,
      achieved,
      completionRate,
      completionDisplay: formatPercent(completionRate),
      progressCombined,
      progressDisplay: formatPercent(progressCombined),
      averageCapaian,
      averageCapaianDisplay: formatPercent(averageCapaian),
      averageGap,
      averageGapDisplay: formatPercent(averageGap),
      coverage,
      coverageDisplay: formatPercent(coverage),
    }
  }, [data?.indikators, integerFormatter, numberFormatter])

  const activeNowAnimated = useAnimatedNumber(summary.activeNow ?? 0, 900)
  const todayViewsAnimated = useAnimatedNumber(summary.today?.views ?? 0, 900)
  const uniqueVisitorsAnimated = useAnimatedNumber(summary.today?.uniqueVisitors ?? 0, 900)

  const visitorTrend = useMemo(() => {
    if (visitorStats.length < 2) {
      return {
        viewsChange: null,
        viewsPct: null,
        uniqueChange: null,
        uniquePct: null,
      }
    }
    const latest = visitorStats[visitorStats.length - 1] ?? {}
    const prev = visitorStats[visitorStats.length - 2] ?? {}
    const viewsChange = Number(latest.views ?? 0) - Number(prev.views ?? 0)
    const uniqueChange = Number(latest.uniqueVisitors ?? 0) - Number(prev.uniqueVisitors ?? 0)
    const viewsPct = prev.views ? (viewsChange / prev.views) * 100 : null
    const uniquePct = prev.uniqueVisitors ? (uniqueChange / prev.uniqueVisitors) * 100 : null
    return {
      viewsChange,
      viewsPct,
      uniqueChange,
      uniquePct,
    }
  }, [visitorStats])

  const formatTrendLabel = useCallback((pct, change, unit) => {
    if (pct === null && change === null) return 'Stabil'
    const baseline = pct ?? change ?? 0
    const arrow = baseline > 0 ? '▲' : baseline < 0 ? '▼' : '▬'
    const pctPart = pct === null ? '' : `${Math.abs(pct).toFixed(1)}%`
    const changePart = change === null ? '' : `${change > 0 ? '+' : change < 0 ? '-' : ''}${Math.abs(change)}${unit ? ` ${unit}` : ''}`
    if (!pctPart && !changePart) return `${arrow} Stabil`
    return `${arrow} ${pctPart}${pctPart && changePart ? ' · ' : ''}${changePart || 'Stabil'}`
  }, [])

  const getTrendClass = useCallback(pct => {
    if (pct === null) return 'border border-slate-200/70 bg-slate-50/80 text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300'
    if (pct > 0) return 'border border-emerald-300/70 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100'
    if (pct < 0) return 'border border-rose-300/70 bg-rose-50/80 text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-100'
    return 'border border-slate-200/70 bg-slate-50/80 text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-300'
  }, [])

  const viewsTrendLabel = useMemo(
    () => formatTrendLabel(visitorTrend.viewsPct, visitorTrend.viewsChange, 'kunjungan'),
    [formatTrendLabel, visitorTrend.viewsPct, visitorTrend.viewsChange],
  )
  const uniqueTrendLabel = useMemo(
    () => formatTrendLabel(visitorTrend.uniquePct, visitorTrend.uniqueChange, 'user'),
    [formatTrendLabel, visitorTrend.uniquePct, visitorTrend.uniqueChange],
  )
  const viewsTrendClass = useMemo(() => getTrendClass(visitorTrend.viewsPct), [getTrendClass, visitorTrend.viewsPct])
  const uniqueTrendClass = useMemo(() => getTrendClass(visitorTrend.uniquePct), [getTrendClass, visitorTrend.uniquePct])

  const handleRekapExport = useCallback(() => {
    if (typeof window === 'undefined') return
    const header = ['Sheet', 'Label', 'Formula', 'Nilai', 'Catatan']
    const allRows = [
      ...rekapAkreditasi.rows.map(row => ['Akreditasi', row.label, row.formula, row.valueDisplay, row.note ?? '']),
      ...rekapIndikator.rows.map(row => ['Indikator', row.label, row.formula, row.valueDisplay, row.note ?? '']),
    ]
    const csv = [header, ...allRows]
      .map(line => line.map(field => `"${String(field ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rekap-dashboard-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [rekapAkreditasi.rows, rekapIndikator.rows])

  const lastUpdatedLabel = useMemo(() => {
    if (!lastUpdated) return 'Belum ada pembaruan'
    return lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }, [lastUpdated])

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/70 via-white to-primary-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8">
        <div className="relative mb-10 overflow-hidden rounded-3xl border border-primary-200/60 bg-gradient-to-br from-primary-100/95 via-white to-primary-200/60 p-8 shadow-lg shadow-primary-300/30 dark:border-slate-800/60 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dashboard-fade">
          <div className="absolute -left-12 top-1/2 hidden h-48 w-48 -translate-y-1/2 rounded-full bg-primary-200/60 blur-3xl md:block" />
          <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[minmax(0,2fr),minmax(0,1.1fr)] md:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-300/70 bg-primary-50/90 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-primary-700 dark:border-primary-500/40 dark:bg-primary-900/40 dark:text-primary-100 dashboard-fade dashboard-fade-delay-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Console Utama
              </div>
              <h2 className="mt-4 text-3xl font-semibold leading-tight text-primary-900 drop-shadow-sm dark:text-primary-50 md:text-4xl dashboard-fade dashboard-fade-delay-2">Dashboard Pengelolaan Mutu Kabupaten/Kota</h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400 md:text-base dashboard-fade dashboard-fade-delay-3">Integrasikan data capaian, monitor aktivitas pengunjung secara realtime, dan orkestrasi dokumen strategis lintas instansi dalam satu pengalaman kerja yang intuitif.</p>
              {user && (
                <div className="mt-6 flex flex-wrap items-center gap-3 text-xs md:text-sm dashboard-fade dashboard-fade-delay-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/70 bg-emerald-100/80 px-4 py-1 text-emerald-700 shadow-sm shadow-emerald-200/40 dark:border-emerald-500/50 dark:bg-emerald-900/30 dark:text-emerald-100">
                    <span className="text-base">🌱</span>
                    <span className="uppercase tracking-[0.22em]">{user.role || 'admin'}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 px-4 py-1 text-slate-700 shadow-sm shadow-slate-200/50 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-100">
                    <span className="text-sm">{getGreeting()}</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</span>
                  </div>
                  {user.instansi && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-1 text-primary-700 shadow-sm shadow-primary-200/40 dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">
                      <span className="text-base">🏛️</span>
                      <span className="max-w-[220px] truncate">{user.instansi}</span>
                    </div>
                  )}
                  {user.city && (
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200/70 bg-sky-50/80 px-4 py-1 text-sky-700 shadow-sm shadow-sky-200/40 dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-sky-100">
                      <span className="text-base">📍</span>
                      <span className="max-w-[220px] truncate">{user.city}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative isolate overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-left shadow-xl shadow-primary-200/40 dark:border-slate-700/50 dark:bg-slate-900/70 dark:text-slate-100 dashboard-fade dashboard-fade-delay-5">
              <div className="absolute -top-12 -right-8 h-32 w-32 rounded-full bg-primary-500/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Status Sistem</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Operasional &amp; Stabil</p>
                  <p className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Update terakhir <span className="font-semibold text-slate-700 dark:text-slate-200">{lastUpdatedLabel}</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/40">⚙️</div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-100/60 px-3 py-1 font-medium text-primary-700 dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">
                  ⏱️ Interval otomatis 15 detik
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-100/60 px-3 py-1 font-medium text-slate-600 dark:border-slate-700/40 dark:bg-slate-800/40 dark:text-slate-200">
                  👀 {activeNowAnimated.toLocaleString('id-ID')} aktif sekarang
                </span>
              </div>
              <button
                onClick={async () => {
                  const ok = await confirmLogout()
                  if (!ok) return
                  await logout()
                  showAlert('success', 'Berhasil logout', 'Anda telah keluar dari dashboard admin.')
                  navigate('/')
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-red-400/40 transition-all hover:scale-105 hover:bg-red-600"
              >
                <span className="text-sm">⏏</span>
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <aside className="md:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="rounded-3xl border border-slate-100/80 bg-white/90 p-4 shadow-md shadow-primary-100/30 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 dashboard-fade">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Navigasi</h3>
                <ul className="space-y-2">
                  {[
                    { key: 'profile', icon: '🙍‍♂️', label: 'Profil Saya' },
                    { key: 'diagram', icon: '📈', label: 'Diagram Summary' },
                    { key: 'charts', icon: '📊', label: 'Chart Editor' },
                    { key: 'table', icon: '📋', label: 'Indikator Data' },
                    { key: 'docs', icon: '📄', label: 'Dokumen' },
                    { key: 'rekap', icon: '📑', label: 'Rekapitulasi' },
                    { key: 'users', icon: '👥', label: 'Manajemen User' },
                  ].map(item => (
                    <li key={item.key}>
                      <button
                        onClick={() => setTab(item.key)}
                        className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-all ${
                          tab === item.key
                            ? 'border-primary-500/70 bg-primary-600/95 text-white shadow-lg shadow-primary-500/40'
                            : 'border-transparent bg-white/40 text-slate-600 hover:border-slate-100/80 hover:bg-white/80 dark:bg-slate-900/30 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="pointer-events-none absolute -right-8 -top-8 h-16 w-16 rounded-full bg-primary-400/10 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-primary-500/10" />
                        <span className={`relative flex h-9 w-9 items-center justify-center rounded-xl text-base transition-transform group-hover:scale-105 ${
                          tab === item.key
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200'
                        }`}
                        >
                          {item.icon}
                        </span>
                        <span className="relative">{item.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-3xl border border-primary-200/80 bg-gradient-to-br from-primary-500/20 via-primary-400/10 to-primary-100/50 p-4 text-sm text-primary-800 shadow-md shadow-primary-200/30 dark:border-primary-500/40 dark:from-primary-900/40 dark:via-primary-800/20 dark:to-primary-900/10 dark:text-primary-100 dashboard-fade dashboard-fade-delay-1">
                <p className="text-[11px] uppercase tracking-[0.3em]">Ringkasan</p>
                <p className="mt-1 text-lg font-semibold">{summary.activeNow ?? 0} Pengunjung aktif</p>
                <p className="text-xs text-primary-700/80 dark:text-primary-200/80">Pantau statistik terbaru di panel Chart</p>
                <div className="mt-3 flex gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2 py-1 text-primary-700 shadow-sm dark:border-primary-800/40 dark:bg-primary-900/40 dark:text-primary-100">
                    ⏱️ {lastUpdatedLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/60 bg-primary-50/70 px-2 py-1 text-primary-700 dark:border-primary-500/30 dark:bg-primary-900/30 dark:text-primary-100">
                    Live Mode {autoRefresh ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>
          </aside>

          <div className="md:col-span-3 flex flex-col gap-4">
            {tab === 'diagram' && (
              <DiagramSummaryPanel
                summary={summary}
                autoRefresh={autoRefresh}
                setAutoRefresh={setAutoRefresh}
                handleRefresh={handleRefresh}
                refreshing={refreshing}
                lastUpdatedLabel={lastUpdatedLabel}
                activeNowAnimated={activeNowAnimated}
                todayViewsAnimated={todayViewsAnimated}
                uniqueVisitorsAnimated={uniqueVisitorsAnimated}
                viewsTrendLabel={viewsTrendLabel}
                uniqueTrendLabel={uniqueTrendLabel}
                viewsTrendClass={viewsTrendClass}
                uniqueTrendClass={uniqueTrendClass}
                lineChartData={lineChartData}
                lineChartOptions={lineChartOptions}
                latestLogs={latestLogs}
              />
            )}

            {tab === 'rekap' ? (
              <RekapitulasiPanel
                onExport={handleRekapExport}
                rekapAkreditasi={rekapAkreditasi}
                rekapIndikator={rekapIndikator}
                section={rekapSection}
                setSection={setRekapSection}
              />
            ) : (
              <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg border border-slate-100/80 dark:border-slate-800/70 p-4 md:p-6">
                <SectionHeader tab={tab} documents={data?.documents} indicators={data?.indikators} />
                {tab === 'profile' && (
                  <AdminProfilePanel
                    user={user}
                    updateProfile={updateProfile}
                    uploadProfilePhoto={uploadProfilePhoto}
                  />
                )}
                {tab === 'charts' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-primary-200/60 bg-primary-50/80 px-4 py-3 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary-600/80 dark:text-primary-300/80 mb-1">Aktivitas</p>
                        <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">Pengelolaan Data</p>
                        <p className="mt-1 text-xs text-primary-700/80 dark:text-primary-200/80">Kelola grafik dan tabel indikator mutu secara terpusat.</p>
                      </div>
                      <div className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-1">Pengguna</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Manajemen Akses</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Atur admin dan member berdasarkan instansi dan kab/kota.</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30">
                        <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700/90 dark:text-emerald-200/80 mb-1">Keamanan</p>
                        <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-100">Proteksi Sistem</p>
                        <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">Login aman dengan reCAPTCHA dan pembatasan kode admin.</p>
                      </div>
                    </div>
                    <ChartEditor />
                  </div>
                )}
                {tab === 'table' && <DataManager />}
                {tab === 'docs' && (
                  <div className="space-y-6">
                    <div className="rounded-3xl border border-primary-200/60 bg-gradient-to-br from-primary-50/80 via-white to-primary-100/70 p-5 shadow-sm shadow-primary-100/40 dark:border-primary-500/40 dark:from-primary-950/50 dark:via-slate-900/70 dark:to-primary-900/30">
                      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Pusat Dokumen</p>
                          <h4 className="text-xl font-semibold text-primary-900 dark:text-primary-100">Katalog Berkas Strategis</h4>
                          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                            Kurasi file penting, atur metadata, dan pantau riwayat versi secara menyeluruh. Semua aksi terdokumentasi dengan jejak audit otomatis.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 font-semibold text-primary-700 shadow-sm dark:border-primary-700/50 dark:bg-primary-900/40 dark:text-primary-100">
                            📂 {Array.isArray(data?.documents) ? data.documents.length : 0} Dokumen
                          </span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/70 px-3 py-1 font-semibold text-primary-700 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">
                            🔐 Akses Aman &amp; Terpantau
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr,1fr]">
                      <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/80">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Tip Pengelolaan</p>
                            <h5 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Drag &amp; drop untuk unggahan cepat</h5>
                          </div>
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-600 dark:bg-primary-900/30 dark:text-primary-200">⚡</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          Sistem akan otomatis memberi nama file sesuai pola yang konsisten. Gunakan kolom deskripsi untuk memberi konteks tambahan dan memudahkan pencarian.
                        </p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                          <li className="flex items-start gap-2"><span className="mt-1 text-primary-500">⦿</span> Gunakan tag judul yang jelas seperti <em>Standar Pelayanan Minimal</em> atau <em>Laporan Mutu Triwulan</em>.</li>
                          <li className="flex items-start gap-2"><span className="mt-1 text-primary-500">⦿</span> Perbarui dokumen lama dengan versi baru agar tim tidak salah pakai.</li>
                          <li className="flex items-start gap-2"><span className="mt-1 text-primary-500">⦿</span> Tandai file penting dengan menambahkan kata kunci di deskripsi.</li>
                        </ul>
                      </div>

                      <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/70 p-4 shadow-sm dark:border-emerald-500/40 dark:from-emerald-900/40 dark:via-slate-900/60 dark:to-emerald-900/20">
                        <p className="text-xs uppercase tracking-[0.24em] text-emerald-700/80 dark:text-emerald-200/80">Audit Singkat</p>
                        <h5 className="mt-1 text-lg font-semibold text-emerald-800 dark:text-emerald-100">Histori unggahan</h5>
                        <div className="mt-3 space-y-2 text-sm">
                          {(Array.isArray(activityLogs) ? activityLogs : []).slice(0, 3).map(log => (
                            <div key={`docs-log-${log.id}`} className="rounded-xl border border-emerald-200/70 bg-white/90 px-3 py-2 text-emerald-800 shadow-sm dark:border-emerald-700/40 dark:bg-emerald-950/30 dark:text-emerald-100">
                              <p className="text-xs uppercase tracking-[0.18em] text-emerald-500">{log.type?.replace(/_/g, ' ') || 'Aktivitas'}</p>
                              <p className="text-sm font-semibold">{log.description}</p>
                              <span className="text-[11px] text-emerald-600/80 dark:text-emerald-300/80">{log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : 'Baru saja'}</span>
                            </div>
                          ))}
                          {(!Array.isArray(activityLogs) || activityLogs.length === 0) && (
                            <p className="text-sm text-emerald-700/80 dark:text-emerald-200/80">Belum ada aktivitas terbaru di pusat dokumen.</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-4 shadow-md dark:border-slate-700/60 dark:bg-slate-900/80">
                      <DataManager docsOnly />
                    </div>
                  </div>
                )}
                {tab === 'users' && <UserManagement />}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const TAB_META = {
  profile: {
    eyebrow: 'Area Profil',
    title: 'Kelola Identitas Admin',
    description: 'Perbarui informasi kontak dan keamanan akun agar tetap terlindungi.',
  },
  charts: {
    eyebrow: 'Chart Builder',
    title: 'Konfigurasi Visualisasi',
    description: 'Susun dan sesuaikan grafik mutu sesuai kebutuhan pelaporan.',
  },
  table: {
    eyebrow: 'Indikator Mutu',
    title: 'Manajemen Data Indikator',
    description: 'Tambah, edit, dan ekspor data capaian untuk setiap kab/kota.',
  },
  docs: {
    eyebrow: 'Dokumentasi',
    title: 'Pusat Dokumen Operasional',
    description: 'Kelola berkas penting, pastikan informasi terbaru selalu tersedia.',
  },
  diagram: {
    eyebrow: 'Analitik Kinerja',
    title: 'Diagram Ringkasan Trafik',
    description: 'Visualisasikan tren pengunjung harian dan aktivitas sistem secara dinamis.',
  },
  rekap: {
    eyebrow: 'Spreadsheet Otomatis',
    title: 'Rekapitulasi & Formula Excel',
    description: 'Pantau rangkuman akreditasi dan indikator lengkap dengan rumus asli.',
  },
  users: {
    eyebrow: 'Manajemen Akses',
    title: 'Kelola Admin & Member',
    description: 'Atur peran dan hak akses untuk memastikan tata kelola berjalan baik.',
  },
}

function SectionHeader({ tab, documents = [], indicators = [] }) {
  const meta = TAB_META[tab]
  if (!meta) return null

  const totalDocuments = Array.isArray(documents) ? documents.length : 0
  const totalIndicators = Array.isArray(indicators) ? indicators.length : 0

  return (
    <div className="flex flex-col gap-4 border-b border-slate-100/70 pb-4 dark:border-slate-800/70 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-600/80 dark:text-primary-300/70">{meta.eyebrow}</p>
        <h3 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{meta.title}</h3>
        {meta.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{meta.description}</p>}
      </div>
      {tab === 'docs' && (
        <div className="rounded-2xl border border-primary-200/70 bg-primary-50/80 px-4 py-3 text-primary-800 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">
          <p className="text-[11px] uppercase tracking-[0.24em] text-primary-600/70 dark:text-primary-200/70">Total Dokumen</p>
          <p className="mt-1 text-2xl font-semibold">{totalDocuments}</p>
          <p className="text-xs text-primary-700/80 dark:text-primary-200/80">Berkas siap diakses</p>
        </div>
      )}
      {tab === 'table' && (
        <div className="rounded-2xl border border-slate-200/70 bg-slate-50/90 px-4 py-3 text-slate-800 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Total Indikator</p>
          <p className="mt-1 text-2xl font-semibold">{totalIndicators}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Data aktif di dashboard</p>
        </div>
      )}
    </div>
  )
}

function DiagramSummaryPanel({
  summary,
  autoRefresh,
  setAutoRefresh,
  handleRefresh,
  refreshing,
  lastUpdatedLabel,
  activeNowAnimated,
  todayViewsAnimated,
  uniqueVisitorsAnimated,
  viewsTrendLabel,
  uniqueTrendLabel,
  viewsTrendClass,
  uniqueTrendClass,
  lineChartData,
  lineChartOptions,
  latestLogs,
}) {
  return (
    <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-3xl border border-slate-100/70 dark:border-slate-800/70 shadow-xl p-5 md:p-8 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Realtime Analytics</p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">Snapshot Trafik &amp; Aktivitas</h3>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">Monitor denyut lalu lintas pengunjung, perubahan tren harian, dan aktivitas terbaru yang tersinkron otomatis setiap 15 detik.</p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleRefresh()}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary-500/30 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary-500/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span className={`text-sm ${refreshing ? 'animate-spin' : ''}`}>⟳</span>
              <span>{refreshing ? 'Memuat...' : 'Refresh Data'}</span>
            </button>
            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-50/70 px-3 py-1 text-[11px] font-semibold text-slate-600 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/40 dark:text-slate-200">
              <input
                type="checkbox"
                className="h-4 w-4 accent-primary-600"
                checked={autoRefresh}
                onChange={e => setAutoRefresh(e.target.checked)}
              />
              Auto refresh 15s
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Mode
            </span>
            <span>
              Terakhir diperbarui <span className="font-semibold normal-case tracking-normal text-slate-600 dark:text-slate-300">{lastUpdatedLabel}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white px-5 py-4 shadow-lg shadow-primary-500/40">
          {autoRefresh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              Live
            </span>
          )}
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Aktif Sekarang</p>
          <p className="mt-2 text-3xl font-semibold leading-tight">{activeNowAnimated.toLocaleString('id-ID')}</p>
          <p className="text-xs text-white/70">Pengunjung realtime</p>
        </div>
        <div className="rounded-2xl border border-slate-100/80 bg-white/95 px-5 py-4 shadow-md dark:border-slate-700/70 dark:bg-slate-900/80">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Kunjungan Hari Ini</p>
          <p className="mt-2 text-2xl font-semibold text-primary-600 dark:text-primary-300">{todayViewsAnimated.toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total page views</p>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${viewsTrendClass}`}>
            {viewsTrendLabel}
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 text-emerald-800 shadow-md dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-600/90 dark:text-emerald-200/80">Pengunjung Unik</p>
          <p className="mt-2 text-2xl font-semibold">{uniqueVisitorsAnimated.toLocaleString('id-ID')}</p>
          <p className="text-xs text-emerald-600/80 dark:text-emerald-200/80">User berbeda</p>
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold ${uniqueTrendClass}`}>
            {uniqueTrendLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-900/60 p-5 shadow-lg shadow-slate-900/40 dark:border-slate-800/70">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Statistik Harian</p>
              <h4 className="mt-1 text-lg font-semibold text-white">30 Hari Terakhir</h4>
            </div>
            <span className="rounded-full border border-slate-700/60 bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300">Pembaruan otomatis aktif</span>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-800/60 bg-slate-950/40 p-3">
            <Line data={lineChartData} options={lineChartOptions} height={240} />
          </div>
        </div>
        <div className="lg:col-span-2 rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-lg shadow-slate-200/30 dark:border-slate-800/70 dark:bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Aktivitas Terbaru</p>
              <h4 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Log Sistem</h4>
            </div>
            <span className="rounded-full border border-slate-200/70 bg-slate-50/80 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-300">{latestLogs.length} entri</span>
          </div>
          <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
            {latestLogs.length === 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada aktivitas terekam.</p>
            )}
            {latestLogs.map(log => (
              <div key={log.id} className="rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary-500">{log.type.replace(/_/g, ' ')}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{log.description}</p>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300">
                  <span>{log.user?.username || 'Sistem'}</span>
                  <span>{log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-4 shadow-md dark:border-slate-800/60 dark:bg-slate-900/70">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Rasio konversi</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{summary.today?.conversionRate ?? '—'}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">(Hitung manual pada API jika tersedia)</p>
        </div>
        <div className="rounded-3xl border border-primary-200/60 bg-primary-50/80 p-4 text-primary-800 shadow-md dark:border-primary-500/40 dark:bg-primary-900/20 dark:text-primary-100">
          <p className="text-xs uppercase tracking-[0.24em]">Highlight</p>
          <p className="mt-2 text-sm">Gunakan diagram ini sebagai referensi untuk pengambilan keputusan cepat &amp; menilai efektivitas kampanye.</p>
        </div>
        <div className="rounded-3xl border border-slate-200/60 bg-white/95 p-4 shadow-md dark:border-slate-800/60 dark:bg-slate-900/70">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Saran</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>• Tetapkan target harian dan bandingkan dengan data 30 hari.</li>
            <li>• Nyalakan auto-refresh saat rapat monitoring.</li>
            <li>• Ekspor data detail lewat modul Chart Editor.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

function RekapitulasiPanel({ onExport, rekapAkreditasi, rekapIndikator, section, setSection }) {
  return (
    <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl border border-slate-100/80 dark:border-slate-800/70 p-5 md:p-7 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Rekapitulasi</p>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Spreadsheet Otomatis Multi-Sheet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">Pilih sheet di bawah untuk melihat tabel akreditasi atau indikator dalam format lembar kerja. Semua formula siap diekspor ke CSV.</p>
        </div>
        <div className="flex flex-col items-start gap-2 md:items-end">
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-2 rounded-full border border-primary-500/40 bg-primary-600 px-4 py-2 text-xs font-semibold text-white shadow-sm shadow-primary-400/30 transition hover:shadow-md hover:shadow-primary-500/40"
          >
            <span className="text-sm">📥</span>
            Export ke CSV
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">Data tersinkron otomatis dari modul Akreditasi &amp; Indikator</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/90 p-1 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
          {[
            { key: 'akreditasi', label: 'Sheet Akreditasi', icon: '🏥' },
            { key: 'indikator', label: 'Sheet Indikator', icon: '📊' },
          ].map(item => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSection(item.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                section === item.key
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-500/40'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">Terinspirasi tampilan Excel klasik — siap diekspor dan dibagikan.</span>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold">
        {section === 'akreditasi' ? (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50/80 px-3 py-1 text-primary-700 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">Rata-rata: {rekapAkreditasi.averageDisplay}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">Level tertinggi: {rekapAkreditasi.bestDisplay}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/70 bg-amber-50/80 px-3 py-1 text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100">Gap tersisa: {rekapAkreditasi.gapDisplay}</span>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50/80 px-3 py-1 text-primary-700 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">Total indikator: {rekapIndikator.total}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">Tercapai: {rekapIndikator.achieved}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-slate-50/80 px-3 py-1 text-slate-600 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200">Data terisi: {rekapIndikator.coverageDisplay}</span>
          </>
        )}
      </div>

      {section === 'akreditasi' ? (
        <RekapAkreditasiSheet rows={rekapAkreditasi.rows} bestDisplay={rekapAkreditasi.bestDisplay} gapDisplay={rekapAkreditasi.gapDisplay} />
      ) : (
        <RekapIndikatorSheet rows={rekapIndikator.rows} achieved={rekapIndikator.achieved} total={rekapIndikator.total} progressDisplay={rekapIndikator.progressDisplay} coverageDisplay={rekapIndikator.coverageDisplay} />
      )}
    </div>
  )
}

function RekapAkreditasiSheet({ rows, bestDisplay, gapDisplay }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary-200/70 bg-gradient-to-br from-primary-100/80 via-white to-primary-200/70 p-5 shadow-sm dark:border-primary-500/40 dark:from-primary-900/40 dark:via-slate-900/60 dark:to-primary-900/20">
        <h4 className="text-lg font-semibold text-primary-900 dark:text-primary-50">Sheet "Akreditasi.xlsx"</h4>
        <p className="mt-1 text-sm text-primary-700/80 dark:text-primary-200/80">Menyorot perhitungan Paripurna, Utama, Madya beserta rata-rata dan gap menuju target 100%.</p>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/40 dark:border-slate-700/60 dark:bg-slate-900/80">
        <table className="min-w-full table-fixed border-collapse text-[13px]">
          <thead className="bg-gradient-to-r from-primary-700 to-primary-500 text-white uppercase tracking-[0.18em]">
            <tr>
              <th className="border border-white/30 px-4 py-3 text-left">No.</th>
              <th className="border border-white/30 px-4 py-3 text-left">Keterangan</th>
              <th className="border border-white/30 px-4 py-3 text-left">Formula Excel</th>
              <th className="border border-white/30 px-4 py-3 text-left">Nilai (%)</th>
              <th className="border border-white/30 px-4 py-3 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {rows.map((row, idx) => (
              <tr
                key={row.key}
                className={`border-b border-slate-200/70 dark:border-slate-800/60 ${idx % 2 === 0 ? 'bg-primary-50/40 dark:bg-slate-900/60' : ''}`}
              >
                <td className="border border-slate-200/60 px-4 py-3 text-slate-500 dark:border-slate-800/60 dark:text-slate-400">{idx + 1}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-semibold text-slate-700 dark:border-slate-800/60 dark:text-slate-100">{row.label}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-mono text-[12px] text-primary-700 dark:border-slate-800/60 dark:text-primary-200">{row.formula}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-semibold text-primary-700 dark:border-slate-800/60 dark:text-primary-200">{row.valueDisplay}</td>
                <td className="border border-slate-200/60 px-4 py-3 text-slate-500 dark:border-slate-800/60 dark:text-slate-400">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-3 py-1 font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-100">Gap ke target 100%: {gapDisplay}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600/10 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">Level tertinggi: {bestDisplay}</span>
      </div>
    </div>
  )
}

function RekapIndikatorSheet({ rows, achieved, total, progressDisplay, coverageDisplay }) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-50/90 via-white to-slate-100/70 p-5 shadow-sm dark:border-slate-700/60 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/40">
        <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Sheet "Indikator.xlsx"</h4>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Memuat formula COUNTIF, AVERAGE, dan persentase kelengkapan data seperti pada contoh lembar kerja.</p>
      </div>
      <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/40 dark:border-slate-700/60 dark:bg-slate-900/80">
        <table className="min-w-full table-fixed border-collapse text-[13px]">
          <thead className="bg-slate-900 text-white uppercase tracking-[0.18em]">
            <tr>
              <th className="border border-white/20 px-4 py-3 text-left">No.</th>
              <th className="border border-white/20 px-4 py-3 text-left">Keterangan</th>
              <th className="border border-white/20 px-4 py-3 text-left">Rumus Excel</th>
              <th className="border border-white/20 px-4 py-3 text-left">Nilai</th>
              <th className="border border-white/20 px-4 py-3 text-left">Catatan</th>
            </tr>
          </thead>
          <tbody className="bg-white text-slate-700 dark:bg-slate-900 dark:text-slate-100">
            {rows.map((row, idx) => (
              <tr
                key={row.key}
                className={`border-b border-slate-200/70 dark:border-slate-800/60 ${idx % 2 === 0 ? 'bg-slate-100/60 dark:bg-slate-900/60' : ''}`}
              >
                <td className="border border-slate-200/60 px-4 py-3 text-slate-500 dark:border-slate-800/60 dark:text-slate-400">{idx + 1}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-semibold text-slate-700 dark:border-slate-800/60 dark:text-slate-100">{row.label}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-mono text-[12px] text-primary-700 dark:border-slate-800/60 dark:text-primary-200">{row.formula}</td>
                <td className="border border-slate-200/60 px-4 py-3 font-semibold text-primary-700 dark:border-slate-800/60 dark:text-primary-200">{row.valueDisplay}</td>
                <td className="border border-slate-200/60 px-4 py-3 text-slate-500 dark:border-slate-800/60 dark:text-slate-400">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100">Mencapai Target: {achieved}/{total}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1 font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-100">Progress Gabungan: {progressDisplay}</span>
        <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-100">Data Terisi: {coverageDisplay}</span>
      </div>
    </div>
  )
}

function AdminProfilePanel({ user, updateProfile, uploadProfilePhoto }) {
  const [email, setEmail] = useState(user?.email || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [password, setPassword] = useState('')
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handlePhotoChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (typeof uploadProfilePhoto !== 'function') {
      setError('Fungsi upload foto tidak tersedia')
      return
    }

    try {
      setUploadingPhoto(true)
      const url = await uploadProfilePhoto(file, user?.username || '')
      if (url) {
        setPhotoUrl(url)
        await updateProfile({ photoUrl: url })
        setMessage('Foto profil berhasil diperbarui')
      } else {
        setError('Gagal mendapatkan URL foto profil')
      }
    } catch (err) {
      console.error('Upload foto profil gagal', err)
      setError(err?.message || 'Gagal mengunggah foto profil')
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      await updateProfile({ email, phone, password: password || undefined })
      if (password) setPassword('')
      setMessage('Profil berhasil diperbarui')
      showAlert('success', 'Berhasil', 'Profil admin berhasil diperbarui.')
    } catch (err) {
      console.error('Update profil admin gagal', err)
      const msg = err?.message || 'Gagal memperbarui profil'
      setError(msg)
      showAlert('error', 'Gagal', msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,1.4fr]">
        <div className="relative overflow-hidden rounded-3xl border border-primary-200/70 bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white shadow-xl">
          <div className="absolute -top-10 -right-6 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="relative space-y-6 p-6">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-semibold text-white overflow-hidden shadow-lg shadow-primary-900/20">
                {photoUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <img src={photoUrl} className="h-full w-full object-cover" />
                ) : (
                  (user?.username || '?').charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-white/70">Akun Admin</p>
                <h3 className="text-2xl font-semibold leading-tight drop-shadow-sm">{user?.username || 'Tidak diketahui'}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">{user?.role || 'admin'}</span>
                  {user?.instansi && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                      🏛️ {user.instansi}
                    </span>
                  )}
                  {user?.city && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                      📍 {user.city}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-white/90 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Email</p>
                <p className="mt-1 font-semibold break-words">{email || 'Belum diatur'}</p>
              </div>
              <div className="rounded-2xl border border-white/30 bg-white/15 px-4 py-3 shadow-sm backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Telepon</p>
                <p className="mt-1 font-semibold">{phone || 'Belum diatur'}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/30 bg-white/15 p-4 text-sm shadow-inner shadow-primary-900/20 backdrop-blur">
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/70">Foto Profil</p>
              <label className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/90 shadow-sm shadow-primary-900/20 transition hover:border-white/70 hover:bg-white/30">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
                <span>📸 Perbarui Foto</span>
              </label>
              {uploadingPhoto && <p className="mt-2 text-[11px] text-white/70">Mengunggah foto...</p>}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-xl shadow-slate-200/40 dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-none">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Pengaturan Akun</p>
              <h4 className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">Detail Kontak &amp; Keamanan</h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pastikan informasi akun Anda terbaru untuk memastikan proses verifikasi berjalan lancar.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">
              🔒 Enkripsi Aktif
            </span>
          </div>

          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm shadow-inner shadow-slate-200/40 transition focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    placeholder="nama@instansi.go.id"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">No. Telepon</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm shadow-inner shadow-slate-200/40 transition focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    placeholder="0812-xxxx-xxxx"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">📱</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Password Baru (opsional)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm shadow-inner shadow-slate-200/40 transition focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-100"
                    placeholder="••••••••"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">🔐</span>
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">Minimal 8 karakter, kombinasikan huruf &amp; angka.</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Status Akun</label>
                <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-inner dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                  <p className="font-semibold">Aktif</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">Terhubung sejak {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : 'awal sistem'}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="text-base">💾</span>
                {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
              {message && <span className="rounded-full border border-emerald-300/70 bg-emerald-50/80 px-4 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100">{message}</span>}
              {error && <span className="rounded-full border border-rose-300/70 bg-rose-50/80 px-4 py-1 text-sm font-medium text-rose-700 dark:border-rose-500/40 dark:bg-rose-900/30 dark:text-rose-100">{error}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
