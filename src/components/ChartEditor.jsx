import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import * as API from '../services/api'

const REGIONS = [
  'Kota Surabaya', 'Kota Malang', 'Kota Kediri', 'Kota Blitar', 'Kota Probolinggo',
  'Kota Pasuruan', 'Kota Mojokerto', 'Kota Madiun', 'Kota Batu',
  'Kabupaten Gresik', 'Kabupaten Sidoarjo', 'Kabupaten Mojokerto', 'Kabupaten Jombang',
  'Kabupaten Nganjuk', 'Kabupaten Madiun', 'Kabupaten Magetan', 'Kabupaten Ngawi',
  'Kabupaten Bojonegoro', 'Kabupaten Tuban', 'Kabupaten Lamongan', 'Kabupaten Pamekasan',
  'Kabupaten Sumenep', 'Kabupaten Bangkalan', 'Kabupaten Sampang', 'Kabupaten Bondowoso',
  'Kabupaten Situbondo', 'Kabupaten Probolinggo', 'Kabupaten Pasuruan', 'Kabupaten Malang',
  'Kabupaten Lumajang', 'Kabupaten Jember', 'Kabupaten Banyuwangi', 'Kabupaten Kediri',
  'Kabupaten Blitar', 'Kabupaten Tulungagung', 'Kabupaten Trenggalek', 'Kabupaten Ponorogo',
  'Kabupaten Pacitan'
];

function showAlert(icon, title, text) {
  if (window.Swal) {
    window.Swal.fire({ icon, title, text })
  } else {
    alert(`${title}\n${text || ''}`)
  }
}

export default function ChartEditor() {
  const { data, saveAkreditasi } = useApp()
  const [local, setLocal] = useState({ ...data.akreditasi })
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [region, setRegion] = useState('')
  const [history, setHistory] = useState([])
  const [historyMonth, setHistoryMonth] = useState('')
  const [historyYear, setHistoryYear] = useState('')

  const years = useMemo(() => {
    const list = []
    for (let y = 2025; y <= 2037; y += 1) list.push(y)
    return list
  }, [])

  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => new Date(0, i).toLocaleString('default', { month: 'short' })), [])

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (historyYear && Number(historyYear) !== Number(item.year)) return false
      if (historyMonth && Number(historyMonth) !== Number(item.month)) return false
      return true
    })
  }, [history, historyMonth, historyYear])

  const reloadHistory = useCallback(async () => {
    try {
      const rows = await API.getAkreditasiPeriods()
      if (Array.isArray(rows)) setHistory(rows)
    } catch (err) {
      console.warn('Failed to load akreditasi history', err)
    }
  }, [])

  // when month/year selected, load akreditasi for that period from API (if available)
  useEffect(() => {
    let ignore = false
    async function loadForPeriod() {
      if (!month || !year) {
        setLocal({ ...data.akreditasi })
        return
      }
      try {
        const akr = await API.getAkreditasi({ year, month, region })
        if (!ignore && akr && typeof akr === 'object') {
          setLocal({
            paripurna: Number(akr.paripurna ?? 0),
            utama: Number(akr.utama ?? 0),
            madya: Number(akr.madya ?? 0),
          })
        }
      } catch (e) {
        console.warn('Failed to load akreditasi for period', e)
        if (!ignore) setLocal({ ...data.akreditasi })
      }
    }
    loadForPeriod()
    return () => {
      ignore = true
    }
  }, [month, year, data.akreditasi])

  useEffect(() => {
    reloadHistory()
  }, [reloadHistory])

  function updateField(key, val) {
    const nv = Number(val)
    setLocal(prev => ({ ...prev, [key]: isNaN(nv) ? 0 : nv }))
  }

  async function save() {
    try {
      await saveAkreditasi({
        ...local,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        region: region || undefined,
      })
      showAlert('success', 'Berhasil', 'Nilai akreditasi berhasil disimpan.')
      reloadHistory()
    } catch (err) {
      console.error('Save akreditasi failed', err)
      showAlert('error', 'Gagal', 'Gagal menyimpan akreditasi: ' + (err?.message || 'Server error'))
    }
  }

  function exportHistory() {
    if (!filteredHistory.length) {
      showAlert('info', 'Tidak ada data', 'Belum ada data riwayat untuk diexport.')
      return
    }
    const header = ['Periode', 'Kab/Kota', 'Paripurna', 'Utama', 'Madya', 'TerakhirDiubah']
    const rows = filteredHistory.map(item => [
      item.month ? `${monthNames[item.month - 1]} ${item.year}` : '-',
      item.region || 'Provinsi',
      Number(item.paripurna ?? 0).toFixed(2),
      Number(item.utama ?? 0).toFixed(2),
      Number(item.madya ?? 0).toFixed(2),
      item.updated_at || ''
    ])
    const csv = [header, ...rows].map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'akreditasi_history.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-slate-100">Live Chart Editor</h3>
      <p className="text-sm text-slate-600 dark:text-slate-300">Ubah nilai akreditasi dan lihat preview real-time pada halaman publik.</p>

      <div className="mt-3 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <select
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-32 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
        >
          <option value="">Bulan</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={e => setYear(e.target.value)}
          className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-28 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
        >
          <option value="">Tahun</option>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={region}
          onChange={e => setRegion(e.target.value)}
          className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-48 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
        >
          <option value="">Semua Kab/Kota (Provinsi)</option>
          {REGIONS.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Paripurna (%)</label>
          <input type="number" min="0" max="100" step="1" value={local.paripurna} onChange={e => updateField('paripurna', e.target.value)} className="w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Utama (%)</label>
          <input type="number" min="0" max="100" step="1" value={local.utama} onChange={e => updateField('utama', e.target.value)} className="w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>
        <div>
          <label className="text-sm text-slate-700 dark:text-slate-200">Madya (%)</label>
          <input type="number" min="0" max="100" step="1" value={local.madya} onChange={e => updateField('madya', e.target.value)} className="w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button onClick={save} className="px-4 py-2 bg-primary-600 text-white rounded">Simpan</button>
        <button onClick={() => setLocal({ ...data.akreditasi })} className="px-4 py-2 border rounded dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Reset</button>
      </div>

      <div className="mt-8">
        <h4 className="font-semibold text-slate-800 dark:text-slate-100">Riwayat Nilai per Periode</h4>
        <p className="text-sm text-slate-500 dark:text-slate-300">Catatan otomatis setiap kali admin menyimpan nilai akreditasi pada bulan & tahun tertentu.</p>
        <div className="mt-3 flex flex-col md:flex-row gap-3 md:items-end">
          <div className="flex gap-2">
            <select
              value={historyMonth}
              onChange={e => setHistoryMonth(e.target.value)}
              className="px-3 py-1.5 border rounded-full text-sm w-32 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
            >
              <option value="">Semua Bulan</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>{monthNames[i]}</option>
              ))}
            </select>
            <select
              value={historyYear}
              onChange={e => setHistoryYear(e.target.value)}
              className="px-3 py-1.5 border rounded-full text-sm w-28 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
            >
              <option value="">Semua Tahun</option>
              {years.map(y => (
                <option key={`hist-${y}`} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setHistoryMonth(''); setHistoryYear('') }} className="px-3 py-1 border rounded text-sm dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Reset Filter</button>
            <button onClick={exportHistory} className="px-3 py-1 bg-primary-600 text-white rounded text-sm">Export CSV</button>
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-slate-100 dark:bg-slate-900 text-left">
              <tr>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Periode</th>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Kab/Kota</th>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Paripurna (%)</th>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Utama (%)</th>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Madya (%)</th>
                <th className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200">Terakhir Diubah</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-3 py-4 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat tersimpan.</td>
                </tr>
              )}
              {filteredHistory.map(item => (
                <tr key={`${item.year}-${item.month}-${item.region || 'prov'}`} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-900">
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">{item.month ? `${monthNames[item.month - 1]} ${item.year}` : '-'}</td>
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">{item.region || 'Provinsi'}</td>
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">{Number(item.paripurna ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">{Number(item.utama ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100">{Number(item.madya ?? 0).toFixed(2)}</td>
                  <td className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400">{item.updated_at ? new Date(item.updated_at).toLocaleString('id-ID') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
