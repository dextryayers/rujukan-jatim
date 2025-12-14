import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

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
      text: 'Anda akan keluar dari sesi member saat ini.',
      showCancelButton: true,
      confirmButtonText: 'Ya, logout',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    })
    return result.isConfirmed
  }
  return window.confirm('Keluar dari dashboard?')
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export default function MemberDashboard() {
  const { user, logout, data, updateProfile } = useApp()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [profileEmail, setProfileEmail] = useState(user?.email || '')
  const [profilePhone, setProfilePhone] = useState(user?.phone || '')
  const [profilePassword, setProfilePassword] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [profileError, setProfileError] = useState('')

  const akreditasiSummary = [
    {
      key: 'paripurna',
      label: 'Paripurna',
      value: Number(data?.akreditasi?.paripurna ?? 0),
      accent: 'border-l-4 border-blue-600 text-blue-700 dark:text-blue-300',
      tone: 'bg-blue-50/80 dark:bg-blue-900/20',
    },
    {
      key: 'utama',
      label: 'Utama',
      value: Number(data?.akreditasi?.utama ?? 0),
      accent: 'border-l-4 border-indigo-600 text-indigo-700 dark:text-indigo-300',
      tone: 'bg-indigo-50/80 dark:bg-indigo-900/20',
    },
    {
      key: 'madya',
      label: 'Madya',
      value: Number(data?.akreditasi?.madya ?? 0),
      accent: 'border-l-4 border-emerald-600 text-emerald-700 dark:text-emerald-300',
      tone: 'bg-emerald-50/80 dark:bg-emerald-900/20',
    },
  ]

  const indikatorAchieved = data.indikators.filter(ind => ind.status === 'Mencapai Target').length

  const overviewCards = [
    {
      title: 'Akreditasi Paripurna',
      value: `${Number(data.akreditasi.paripurna ?? 0).toFixed(1)}%`,
      icon: '🏅',
      tone: 'from-blue-500/15 to-blue-500/5 text-blue-700 dark:text-blue-200',
    },
    {
      title: 'Akreditasi Utama',
      value: `${Number(data.akreditasi.utama ?? 0).toFixed(1)}%`,
      icon: '📈',
      tone: 'from-indigo-500/15 to-indigo-500/5 text-indigo-700 dark:text-indigo-200',
    },
    {
      title: 'Akreditasi Madya',
      value: `${Number(data.akreditasi.madya ?? 0).toFixed(1)}%`,
      icon: '🌱',
      tone: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700 dark:text-emerald-200',
    },
    {
      title: 'Indikator Mencapai Target',
      value: `${indikatorAchieved}/${data.indikators.length}`,
      icon: '✅',
      tone: 'from-purple-500/15 to-purple-500/5 text-purple-700 dark:text-purple-200',
    },
  ]

  if (!user) {
    return <div className="text-center py-12">Loading...</div>
  }

  const handleLogout = async () => {
    const ok = await confirmLogout()
    if (!ok) return
    await logout()
    showAlert('success', 'Berhasil logout', 'Anda telah keluar dari dashboard member.')
    navigate('/')
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute top-1/2 right-0 h-72 w-72 -translate-y-1/2 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10 lg:py-12">
      {/* Header */}
      <div className="flex flex-col gap-5 mb-10 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700 shadow-sm ring-1 ring-primary-200/60 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Dashboard Member
          </div>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight md:text-4xl">Pusat Informasi Mutu</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {getGreeting()},
            {' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-600/10 px-3 py-1 text-primary-800 ring-1 ring-primary-500/30 dark:bg-primary-900/40 dark:text-primary-100">
              <span className="text-[10px]">🛡️</span>
              <span className="uppercase tracking-[0.2em]">{user.role || 'member'}</span>
            </span>
            {user.instansi && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-slate-700 ring-1 ring-slate-200/60 backdrop-blur dark:bg-slate-900/70 dark:text-slate-100 dark:ring-slate-700">
                <span className="text-[10px]">🏛️</span>
                <span className="truncate max-w-[200px]">{user.instansi}</span>
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-slate-700 ring-1 ring-slate-200/60 backdrop-blur dark:bg-slate-900/70 dark:text-slate-100 dark:ring-slate-700">
                <span className="text-[10px]">📍</span>
                <span className="truncate max-w-[200px]">{user.city}</span>
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={handleLogout} 
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95 self-start md:self-auto"
        >
          Logout
        </button>
      </div>

      {/* Quick glance cards always visible */}
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map(card => (
          <div
            key={card.title}
            className={`group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br ${card.tone} p-4 shadow-lg shadow-primary-500/10 backdrop-blur transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800/70`}
          >
            <div className="flex items-center justify-between">
              <span className="text-3xl">{card.icon}</span>
              <span className="text-xs uppercase tracking-[0.24em] text-slate-500/80 dark:text-slate-400/70">KPI</span>
            </div>
            <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{card.title}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-200/80 dark:border-slate-700 flex-wrap pb-1">
        {[
          { id: 'overview', label: 'Ringkasan' },
          { id: 'profil', label: 'Profil Saya' },
          { id: 'akreditasi', label: 'Akreditasi' },
          { id: 'indikator', label: 'Indikator' },
          { id: 'dokumen', label: 'Dokumen' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors border ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                : 'bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr,1fr]">
            <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-200/60 backdrop-blur dark:bg-slate-900/80 dark:ring-slate-800/80">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Insight Akreditasi Terkini</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Monitor performa akreditasi dan pencapaian indikator secara real-time.</p>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                {akreditasiSummary.map(item => (
                  <div key={item.key} className={`rounded-2xl ${item.tone} ${item.accent} p-4 shadow-sm`}> 
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{item.label}</p>
                    <p className="mt-2 text-3xl font-bold">{item.value.toFixed(1)}%</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl ring-1 ring-slate-800/80">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-300">Aktivitas Sistem</p>
              <h3 className="mt-2 text-2xl font-semibold">Aktivitas Terakhir</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">📂</span>
                  <div>
                    <p className="font-semibold">{data.documents.length} Dokumen Publik</p>
                    <p className="text-slate-300">Tersedia untuk seluruh anggota.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">📊</span>
                  <div>
                    <p className="font-semibold">{indikatorAchieved} indikator mencapai target</p>
                    <p className="text-slate-300">Pantau kualitas layanan secara periodik.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 text-lg">🕒</span>
                  <div>
                    <p className="font-semibold">{data.akreditasi.recordedAt ? new Date(data.akreditasi.recordedAt).toLocaleDateString('id-ID') : 'Belum tercatat'}</p>
                    <p className="text-slate-300">Tanggal pencatatan akreditasi terakhir.</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PROFIL TAB */}
      {activeTab === 'profil' && (
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg p-6 border border-slate-100/80 dark:border-slate-800/70">
          <h2 className="text-2xl font-bold mb-6">Informasi Profil Saya</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Username</label>
              <p className="text-lg font-semibold p-3 bg-slate-100 dark:bg-slate-700 rounded">{user.username}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Role</label>
              <p className="text-lg font-semibold p-3 bg-slate-100 dark:bg-slate-700 rounded capitalize">{user.role}</p>
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Email</label>
              <input
                type="email"
                value={profileEmail}
                onChange={e => setProfileEmail(e.target.value)}
                className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">No. Telepon</label>
              <input
                type="tel"
                value={profilePhone}
                onChange={e => setProfilePhone(e.target.value)}
                className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Password Baru (opsional)</label>
              <input
                type="password"
                value={profilePassword}
                onChange={e => setProfilePassword(e.target.value)}
                className="mt-1 w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-col md:flex-row gap-3 items-start md:items-center">
            <button
              type="button"
              disabled={profileLoading}
              onClick={async () => {
                setProfileLoading(true)
                setProfileMessage('')
                setProfileError('')
                try {
                  const payload = { email: profileEmail, phone: profilePhone }
                  if (profilePassword) payload.password = profilePassword
                  await updateProfile(payload)
                  setProfileMessage('Profil berhasil diperbarui')
                  if (profilePassword) setProfilePassword('')
                } catch (err) {
                  setProfileError(err?.message || 'Gagal memperbarui profil')
                } finally {
                  setProfileLoading(false)
                }
              }}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-60"
            >
              {profileLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            {profileMessage && (
              <span className="text-sm text-green-600 dark:text-green-400">{profileMessage}</span>
            )}
            {profileError && (
              <span className="text-sm text-red-600 dark:text-red-400">{profileError}</span>
            )}
          </div>
        </div>
      )}

      {/* AKREDITASI TAB */}
      {activeTab === 'akreditasi' && (
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Status Akreditasi</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Tabel ringkas capaian akreditasi fasilitas rujukan.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Read Only</span>
          </div>
          <div className="overflow-x-auto rounded-3xl border-2 border-slate-300/70 shadow-inner">
            <table className="min-w-full table-fixed">
              <thead>
                <tr className="bg-gradient-to-r from-primary-600 to-primary-500 text-left text-sm font-semibold uppercase tracking-[0.22em] text-white">
                  <th className="px-5 py-4 w-1/3">Kategori</th>
                  <th className="px-5 py-4 w-1/3">Persentase</th>
                  <th className="px-5 py-4 w-1/3">Catatan</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 text-slate-800 dark:bg-slate-900 dark:text-slate-100">
                {akreditasiSummary.map((row, idx) => (
                  <tr key={row.key} className={`text-base font-medium ${idx % 2 === 0 ? 'bg-slate-50/80 dark:bg-slate-900/60' : ''}`}>
                    <td className="px-5 py-4 font-semibold">{row.label}</td>
                    <td className="px-5 py-4 text-2xl font-bold tracking-tight">{row.value.toFixed(2)}%</td>
                    <td className="px-5 py-4 text-sm text-slate-500 dark:text-slate-400">Menggambarkan capaian fasilitas dengan predikat {row.label.toLowerCase()}.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">*Data akreditasi bersifat read-only. Silakan hubungi admin untuk pembaruan.</p>
        </div>
      )}

      {/* INDIKATOR TAB */}
      {activeTab === 'indikator' && (
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col gap-2 mb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Indikator Nasional</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">Detail capaian indikator mutu pelayanan.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Total {data.indikators.length}</span>
          </div>
          <div className="overflow-x-auto rounded-3xl border-2 border-slate-300/70 shadow-inner">
            <table className="min-w-full text-left">
              <thead>
                <tr className="bg-slate-900 text-white text-xs font-semibold uppercase tracking-[0.22em]">
                  <th className="px-5 py-4 w-16">No.</th>
                  <th className="px-5 py-4 min-w-[220px]">Indikator</th>
                  <th className="px-5 py-4 w-32">Capaian</th>
                  <th className="px-5 py-4 w-32">Target</th>
                  <th className="px-5 py-4 w-32">Status</th>
                  <th className="px-5 py-4 w-40">Wilayah / Periode</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 dark:bg-slate-900/90 text-sm">
                {data.indikators.map((ind, idx) => {
                  const capaian = typeof ind.capaian === 'number' ? ind.capaian : (isNaN(Number(ind.capaian)) ? 0 : Number(ind.capaian))
                  const target = typeof ind.target === 'number' ? ind.target : (isNaN(Number(ind.target)) ? 0 : Number(ind.target))
                  const statusPositive = ind.status === 'Mencapai Target'
                  return (
                    <tr key={ind.id} className={`border-b-2 border-slate-200/70 dark:border-slate-800/70 ${idx % 2 === 0 ? 'bg-slate-50/70 dark:bg-slate-900/60' : ''}`}>
                      <td className="px-5 py-4 font-semibold text-slate-500 dark:text-slate-400">{idx + 1}</td>
                      <td className="px-5 py-4 text-slate-900 dark:text-slate-100">
                        <p className="font-semibold">{ind.name}</p>
                        {ind.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ind.description}</p>}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{capaian.toFixed(2)}%</td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">{target.toFixed(2)}%</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusPositive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'}`}>
                          {statusPositive ? '▲' : '▼'} {ind.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{ind.region || 'Provinsi'}</div>
                        <div>
                          {ind.date ? new Date(ind.date).toLocaleDateString('id-ID') : 'Periode berjalan'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DOKUMEN TAB */}
      {activeTab === 'dokumen' && (
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg p-6 border border-slate-100/80 dark:border-slate-800/70">
          <h2 className="text-2xl font-bold mb-6">Dokumen Tersedia</h2>
          {data.documents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.documents.map(doc => (
                <div key={doc.id} className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:shadow-lg hover:-translate-y-0.5 transition-transform transition-shadow">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{doc.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{doc.description || 'Tidak ada deskripsi'}</p>
                  <a
                    href={doc.fileUrl}
                    download
                    className="inline-block px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm font-semibold"
                  >
                    📥 Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">Tidak ada dokumen tersedia.</p>
          )}
        </div>
      )}
      </div>
    </div>
  )
}
