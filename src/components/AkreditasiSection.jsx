import React, { useEffect, useMemo, useState } from 'react'
import { Pie, Bar } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
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
]

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function AkreditasiSection() {
  const { data } = useApp()
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [region, setRegion] = useState('')
  const [local, setLocal] = useState({ ...data.akreditasi })

  const years = useMemo(() => {
    const list = []
    for (let y = 2025; y <= 2037; y += 1) list.push(y)
    return list
  }, [])

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
        console.warn('Failed to load akreditasi for period in public chart', e)
        if (!ignore) setLocal({ ...data.akreditasi })
      }
    }
    loadForPeriod()
    return () => {
      ignore = true
    }
  }, [month, year, data.akreditasi])

  const pieData = {
    labels: ['Paripurna', 'Utama', 'Madya'],
    datasets: [
      {
        data: [local.paripurna, local.utama, local.madya],
        backgroundColor: ['#1e40af', '#3b82f6', '#10b981'],
        hoverOffset: 6
      }
    ]
  }

  const barData = {
    labels: ['Paripurna', 'Utama', 'Madya'],
    datasets: [
      {
        label: 'Persentase Akreditasi',
        data: [local.paripurna, local.utama, local.madya],
        backgroundColor: ['#1e40af', '#3b82f6', '#10b981']
      }
    ]
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg p-6 md:p-8 border border-slate-100/80 dark:border-slate-800/70">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Ringkasan Akreditasi Rumah Sakit</h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Persentase capaian akreditasi fasilitas pelayanan kesehatan rujukan di Jawa Timur.</p>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-32 bg-white/70 dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-28 bg-white/70 dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Tahun</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full sm:w-48 bg-white/70 dark:bg-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Semua Kab/Kota (Provinsi)</option>
            {REGIONS.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="col-span-2">
            <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-100/80 dark:border-slate-800/80">
              <Bar data={barData} options={{ indexAxis: 'y', responsive: true, plugins: { legend: { display: false } } }} />
            </div>
          </div>
          <div>
            <div className="bg-slate-50/80 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-100/80 dark:border-slate-800/80">
              <Pie data={pieData} />
            </div>
            <div className="mt-4">
              <a
                href="https://drive.google.com/drive/folders/1NMeckaJHmKTGxJwosEBF1yJp-IkR_EJr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition"
              >
                <span>📊</span>
                <span>Data Lengkap Akreditasi RS</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
