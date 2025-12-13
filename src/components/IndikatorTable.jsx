import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';

const KOTA_KABUPATEN_JATIM = [
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

function StatusBadge({ status }) {
  const ok = status === 'Mencapai Target';
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-sm ${ok ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
      {ok ? '✅' : '❌'}&nbsp;{status}
    </span>
  );
}

export default function IndikatorTable() {
  const { data, setData } = useApp();
  const [q, setQ] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [asc, setAsc] = useState(true);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [region, setRegion] = useState('');

  const years = useMemo(() => {
    const list = [];
    for (let y = 2025; y <= 2037; y += 1) list.push(y);
    return list;
  }, []);

  const list = useMemo(() => {
    const filtered = data.indikators
      .filter(i => i.name.toLowerCase().includes(q.toLowerCase()))
      .filter(i => {
        if (!month && !year) return true;
        if (!i.date) return false;
        const date = new Date(i.date);
        if (Number.isNaN(date.getTime())) return false;
        const mOk = month ? date.getMonth() + 1 === parseInt(month, 10) : true;
        const yOk = year ? date.getFullYear() === parseInt(year, 10) : true;
        const rOk = region ? (i.region || '').toLowerCase() === region.toLowerCase() : true;
        return mOk && yOk && rOk;
      });
    const sorted = filtered.sort((a, b) => {
      if (sortKey === 'capaian') return asc ? a.capaian - b.capaian : b.capaian - a.capaian;
      return asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    });
    return sorted;
  }, [data.indikators, q, sortKey, asc, month, year]);

  function toggleSort(key) {
    if (sortKey === key) setAsc(!asc);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-md md:shadow-lg p-4 md:p-6 border border-slate-100/80 dark:border-slate-700/60 transition-transform duration-200 section-glow">
      <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">GAMBARAN CAPAIAN INDIKATOR NASIONAL MUTU RUMAH SAKIT DI JAWA TIMUR TAHUN {year || new Date().getFullYear()}</h3>
      <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300">
          Data ringkasan ditampilkan di tabel di bawah. Untuk dokumen lengkap indikator nasional, silakan unduh melalui tombol berikut.
        </p>
        <a
          href="https://drive.google.com/drive/folders/1RkQyCfYR39JWahLNp0Hu29Xfyld2LxqE"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-full text-xs md:text-sm font-semibold shadow-sm hover:shadow-md transition self-start sm:self-auto"
        >
          <span>📁</span>
          <span>Indikator Nasional Lengkap</span>
        </a>
      </div>
      <div className="mt-4 indikator-filter-group">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search indikator..."
            className="px-3 py-1.5 border rounded-full text-sm w-full md:w-40 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          />
          <select
            value={month}
            onChange={e => setMonth(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full md:w-28 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Bulan</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('default', { month: 'short' })}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full md:w-20 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Tahun</option>
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="px-3 py-1.5 border rounded-full text-sm w-full md:w-40 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
          >
            <option value="">Semua Kab/Kota</option>
            {KOTA_KABUPATEN_JATIM.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <button onClick={() => toggleSort('name')} className="px-2 py-1 bg-primary-50 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-slate-600 rounded text-sm w-full md:w-24 transition-colors">Sort Nama</button>
          <button onClick={() => toggleSort('capaian')} className="px-2 py-1 bg-primary-50 dark:bg-slate-700 hover:bg-primary-100 dark:hover:bg-slate-600 rounded text-sm w-full md:w-24 transition-colors">Sort Capaian</button>
        </div>
      </div>

      {/* Table for md+ screens */}
      <div className="mt-4 indikator-table-wrapper hidden md:block">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/60">
            <tr className="border-b dark:border-slate-700">
              <th className="py-2 text-slate-700 dark:text-slate-300">INDIKATOR</th>
              <th className="py-2 text-slate-700 dark:text-slate-300">Kab/Kota</th>
              <th className="py-2 text-slate-700 dark:text-slate-300">CAPAIAN (%)</th>
              <th className="py-2 text-slate-700 dark:text-slate-300">STATUS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map(row => (
              <tr key={row.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-900/70">
                <td className="py-2 text-slate-900 dark:text-slate-100">{row.name}</td>
                <td className="py-2 text-slate-900 dark:text-slate-100">{row.region || '-'}</td>
                <td className="py-2 text-slate-900 dark:text-slate-100">{typeof row.capaian === 'number' ? row.capaian.toFixed(2) : (isNaN(Number(row.capaian)) ? '-' : Number(row.capaian).toFixed(2))}</td>
                <td className="py-2"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card list for small screens */}
      <div className="mt-4 indikator-card-list md:hidden">
        {list.map(row => (
          <div
            key={row.id}
            className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-slate-200/80 dark:border-slate-700 shadow-sm transition hover:shadow-md hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-semibold text-slate-900 dark:text-slate-100">{row.name}</div>
                {row.region && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kab/Kota: <span className="font-medium">{row.region}</span></div>
                )}
                <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">Capaian: <span className="font-medium">{typeof row.capaian === 'number' ? row.capaian.toFixed(2) : (isNaN(Number(row.capaian)) ? '-' : Number(row.capaian).toFixed(2))}%</span></div>
              </div>
              <div className="ml-3 flex-shrink-0">
                <StatusBadge status={row.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
