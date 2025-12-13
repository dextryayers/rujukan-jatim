import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import logo from '../../images/jawa.png' // Updated path to point to the `images` folder

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user, logout, theme, toggleTheme } = useApp()
  const location = useLocation()
  const navigate = useNavigate()

  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const dateStr = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  const isPublic = location.pathname === '/'
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  const headerClass = isPublic
    ? 'sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-sm'
    : isAuthPage
      ? 'sticky top-0 z-40 bg-blue-950/95 backdrop-blur-xl border-b border-blue-900/80 shadow-sm'
      : 'sticky top-0 z-40 bg-slate-950/70 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/70 shadow-sm'

  const navLinkClass = isPublic
    ? 'text-slate-700 dark:text-slate-100 hover:text-primary-700 dark:hover:text-primary-300 transition-colors'
    : 'text-slate-200 hover:text-primary-300 transition-colors'

  const timeTextClass = isPublic
    ? 'text-slate-600 dark:text-slate-300'
    : 'text-slate-300'

  const titleTextClass = isPublic
    ? 'text-primary-800 dark:text-primary-200'
    : 'text-slate-50'

  const subtitleTextClass = isPublic
    ? 'text-slate-600 dark:text-slate-300'
    : 'text-slate-200'

  async function handleLogout() {
    if (window.Swal) {
      const result = await window.Swal.fire({
        icon: 'question',
        title: 'Keluar dari akun?',
        text: 'Anda akan keluar dari sesi saat ini.',
        showCancelButton: true,
        confirmButtonText: 'Ya, logout',
        cancelButtonText: 'Batal',
        reverseButtons: true,
      })
      if (!result.isConfirmed) return
      await logout()
      await window.Swal.fire({ icon: 'success', title: 'Berhasil logout', text: 'Anda telah keluar dari akun.' })
      navigate('/')
      setOpen(false)
      return
    }
    await logout()
    navigate('/')
    setOpen(false)
  }

  return (
    <header className={headerClass}>
      <div className="container mx-auto px-3 py-2 md:px-4 md:py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3">
          <img src={logo} alt="Logo" className="h-10 w-auto md:h-14 ml-2 md:ml-7" />
          <div>
            <div className={`font-bold text-xs md:text-lg ml-2 md:ml-5 ${titleTextClass}`}>PELAYANAN KESEHATAN RUJUKAN</div>
            <div className={`text-[10px] md:text-sm ml-2 md:ml-5 ${subtitleTextClass}`}>DINAS KESEHATAN PROVINSI JAWA TIMUR</div>
          </div>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <div className={`flex flex-col items-end text-[11px] mr-1 ${timeTextClass}`}>
            <span className="font-semibold leading-tight">{timeStr}</span>
            <span className="leading-tight capitalize">{dateStr}</span>
          </div>
          <nav className="flex items-center space-x-6 text-sm font-medium">
          <Link to="/" className={navLinkClass}>Home</Link>
          <Link to="/#akreditasi" className={navLinkClass}>Akreditasi</Link>
          <Link to="/#indikator" className={navLinkClass}>Indikator</Link>
          <Link to="/#dokumen" className={navLinkClass}>Dokumen</Link>
          {user ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/member'}
              className="px-3 py-1.5 rounded-full bg-primary-600/90 text-white hover:bg-primary-500 text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95"
            >
              Dashboard
            </Link>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded-full bg-primary-500/90 text-white hover:bg-primary-400 text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Login</Link>
          )}
          <button onClick={toggleTheme} aria-label="Toggle dark mode" className={isPublic ? 'text-slate-700 dark:text-slate-200' : 'text-slate-200'}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          </nav>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <div className="flex flex-col text-[10px] text-slate-600 dark:text-slate-300 mr-1 text-right">
            <span className="font-semibold leading-tight">{timeStr}</span>
            <span className="leading-tight capitalize truncate max-w-[120px]">{dateStr}</span>
          </div>
          <button onClick={() => setOpen(!open)} className="p-2 rounded-md bg-primary-600 text-white shadow-sm active:scale-95 transition-transform">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden bg-white/90 dark:bg-slate-900/90 shadow-md">
          <div className="px-4 py-3 flex flex-col space-y-2">
            <Link to="/" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Home</Link>
            <Link to="/#akreditasi" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Akreditasi</Link>
            <Link to="/#indikator" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Indikator</Link>
            <Link to="/#dokumen" onClick={() => setOpen(false)} className="text-slate-700 dark:text-slate-200">Dokumen</Link>
            {user ? (
              <div className="flex items-center justify-between">
                <Link
                  to={user.role === 'admin' ? '/admin' : '/member'}
                  onClick={() => setOpen(false)}
                  className="text-primary-700 dark:text-primary-300"
                >
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-red-500">Logout</button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setOpen(false)} className="text-primary-700 dark:text-primary-300">Login</Link>
            )}
            <button onClick={toggleTheme} aria-label="Toggle dark mode" className="text-slate-700 dark:text-slate-200 text-left">{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
          </div>
        </div>
      )}
    </header>
  )
}
