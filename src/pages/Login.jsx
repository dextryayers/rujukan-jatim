import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import useRecaptcha from '../hooks/useRecaptcha'

export default function Login() {
  const { login, user, theme } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const getLoginToken = useRecaptcha('login')
  const navigate = useNavigate()

  function showAlert(icon, title, text) {
    if (window.Swal) {
      window.Swal.fire({ icon, title, text })
    } else {
      // Fallback ke alert biasa jika SweetAlert2 belum termuat
      // eslint-disable-next-line no-alert
      alert(`${title}\n${text || ''}`)
    }
  }

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = await getLoginToken()
      if (!token) {
        throw new Error('Validasi keamanan gagal, coba lagi.')
      }
      const ok = await login(email, password, token)
      if (ok) {
        // Tampilkan alert sukses, lalu redirect berdasarkan role (di useEffect)
        showAlert('success', 'Login berhasil', 'Mengalihkan ke dashboard...')
      } else {
        setError('Login gagal. Cek email/password.')
        showAlert('error', 'Login gagal', 'Cek email dan password Anda.')
      }
    } catch (err) {
      setError(err?.message || 'Login gagal')
      showAlert('error', 'Login gagal', err?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  // Redirect after successful login based on user role
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (user.role === 'member') {
        navigate('/member', { replace: true })
      }
    }
  }, [user, navigate])

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.28),_transparent_55%)]">
      <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/70 px-8 py-10 md:px-12 md:py-12 auth-card-blink auth-glow">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-50">Silahkan Login</h1>
        <p className="text-base text-slate-300 mt-2">Masuk untuk mengelola data.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <div>
            <label className="text-sm md:text-base text-slate-200">Email</label>
            <input 
              type="email"
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="mt-1 w-full border px-4 py-3 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70" 
              placeholder="nama@contoh.com"
            />
          </div>
          <div>
            <label className="text-sm md:text-base text-slate-200">Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border px-4 py-3 pr-12 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-slate-400"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-300 bg-red-900/40 border border-red-700/70 rounded px-3 py-2">{error}</div>}
          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95 disabled:opacity-60">{loading ? 'Memproses...' : 'Login'}</button>
        </form>
        <div className="mt-4 text-sm text-slate-300 flex items-center justify-between">
          <span>Belum punya akun?</span>
          <Link className="text-primary-300 hover:text-primary-200 font-semibold" to="/register">Daftar</Link>
        </div>
      </div>
    </div>
  )
}
