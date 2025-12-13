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
    <div className="min-h-screen bg-gradient-to-b from-primary-50/70 via-white to-primary-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.24em] text-primary-700/80 dark:text-primary-300/80 uppercase mb-1">Dashboard Member</p>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Pusat Informasi Mutu</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {getGreeting()},
            {' '}
            <span className="font-semibold text-slate-900 dark:text-slate-100">{user.username}</span>
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-primary-200/80 bg-primary-50/80 px-3 py-1 text-primary-800 dark:border-primary-500/40 dark:bg-primary-900/40 dark:text-primary-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="uppercase tracking-[0.18em]">{user.role || 'member'}</span>
            </span>
            {user.instansi && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                <span className="text-[10px]">🏛️</span>
                <span className="truncate max-w-[180px]">{user.instansi}</span>
              </span>
            )}
            {user.city && (
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100">
                <span className="text-[10px]">📍</span>
                <span className="truncate max-w-[160px]">{user.city}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50/90 dark:bg-blue-900/30 rounded-2xl shadow-sm border border-blue-100/70 dark:border-blue-900/40">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Akreditasi Paripurna</p>
              <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-300">{data.akreditasi.paripurna}%</p>
            </div>
            <div className="p-4 bg-indigo-50/90 dark:bg-indigo-900/30 rounded-2xl shadow-sm border border-indigo-100/70 dark:border-indigo-900/40">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Akreditasi Utama</p>
              <p className="mt-2 text-3xl font-bold text-indigo-700 dark:text-indigo-300">{data.akreditasi.utama}%</p>
            </div>
            <div className="p-4 bg-green-50/90 dark:bg-green-900/30 rounded-2xl shadow-sm border border-green-100/70 dark:border-green-900/40">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Akreditasi Madya</p>
              <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-300">{data.akreditasi.madya}%</p>
            </div>
            <div className="p-4 bg-purple-50/90 dark:bg-purple-900/30 rounded-2xl shadow-sm border border-purple-100/70 dark:border-purple-900/40">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Indikator Mencapai</p>
              <p className="mt-2 text-3xl font-bold text-purple-700 dark:text-purple-300">{data.indikators.filter(i => i.status === 'Mencapai Target').length}/{data.indikators.length}</p>
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
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg p-6 border border-slate-100/80 dark:border-slate-800/70">
          <h2 className="text-2xl font-bold mb-6">Status Akreditasi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-600">
              <p className="text-sm text-slate-600 dark:text-slate-400">Paripurna</p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">{data.akreditasi.paripurna}%</p>
            </div>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded border-l-4 border-indigo-600">
              <p className="text-sm text-slate-600 dark:text-slate-400">Utama</p>
              <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 mt-2">{data.akreditasi.utama}%</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border-l-4 border-green-600">
              <p className="text-sm text-slate-600 dark:text-slate-400">Madya</p>
              <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">{data.akreditasi.madya}%</p>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm">*Data akreditasi bersifat read-only. Silakan hubungi admin untuk perubahan.</p>
        </div>
      )}

      {/* INDIKATOR TAB */}
      {activeTab === 'indikator' && (
        <div className="section-glow bg-white/95 dark:bg-slate-900/95 rounded-2xl shadow-lg p-6 border border-slate-100/80 dark:border-slate-800/70">
          <h2 className="text-2xl font-bold mb-6">Indikator Nasional</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Indikator</th>
                  <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Capaian</th>
                  <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Target</th>
                  <th className="px-4 py-3 text-slate-700 dark:text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.indikators.map(ind => {
                  const capaian = typeof ind.capaian === 'number' ? ind.capaian : (isNaN(Number(ind.capaian)) ? 0 : Number(ind.capaian))
                  const target = typeof ind.target === 'number' ? ind.target : (isNaN(Number(ind.target)) ? 0 : Number(ind.target))
                  return (
                    <tr key={ind.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{ind.name}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{capaian.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{target.toFixed(2)}%</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${ind.status === 'Mencapai Target' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                          {ind.status === 'Mencapai Target' ? '✓' : '✕'} {ind.status}
                        </span>
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
