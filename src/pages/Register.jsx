import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import useRecaptcha from '../hooks/useRecaptcha'

// Daftar Kota/Kabupaten di Jawa Timur
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
]

export default function Register() {
  const { register } = useApp()
  const [role, setRole] = useState('member')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [city, setCity] = useState('')
  const [instansi, setInstansi] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()
  const getRegisterToken = useRecaptcha('register')
  const getLoginToken = useRecaptcha('login')

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
    if (password !== confirm) {
      setError('Password tidak sama')
      return
    }
    const trimmedFullName = fullName.trim()
    
    if (!trimmedFullName) {
      setError('Nama lengkap wajib diisi')
      return
    }
    
    // Kota/Kabupaten & Instansi wajib untuk semua akun (member maupun admin)
    if (!city) {
      setError('Kota/Kabupaten wajib diisi')
      return
    }
    if (!instansi) {
      setError('Instansi wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Get reCAPTCHA token hanya untuk registrasi admin
      let recaptchaToken
      if (role === 'admin') {
        recaptchaToken = await getRegisterToken()
        if (!recaptchaToken) {
          throw new Error('Validasi keamanan gagal, coba lagi.')
        }
      }

      // Token login untuk auto-login setelah registrasi (boleh untuk kedua role)
      const loginRecaptchaToken = await getLoginToken()
      
      const ok = await register(
        username,
        password,
        email,
        phone,
        role,
        undefined, // nik (tidak digunakan)
        trimmedFullName,
        city,
        instansi,
        recaptchaToken,
        loginRecaptchaToken,
        role === 'admin' ? adminCode.trim() : undefined,
      )
      if (ok) {
        showAlert('success', 'Registrasi berhasil', `Akun ${role === 'admin' ? 'Admin' : 'Member'} berhasil dibuat.`)
        if (role === 'admin') {
          navigate('/admin', { replace: true })
        } else {
          navigate('/member', { replace: true })
        }
      } else {
        setError('Registrasi gagal')
        showAlert('error', 'Registrasi gagal', 'Silakan cek kembali data Anda.')
      }
    } catch (err) {
      setError(err?.message || 'Registrasi gagal')
      showAlert('error', 'Registrasi gagal', err?.message || 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const roleTitle = role === 'admin' ? 'Admin' : 'Member'

  return (
    <div
      className="min-h-screen bg-slate-950 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1584466977773-e625c37cdd50?q=80&w=1600&auto=format&fit=crop')",
      }}
    >
      <div className="min-h-screen bg-slate-950/80 backdrop-blur-xl flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-slate-50 mb-2">Buat Akun</h1>
            <p className="text-slate-300 text-sm">Pilih jenis akun dan lengkapi data singkat Anda.</p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => { setRole('member'); setCity(''); setInstansi('') }}
              className={`p-4 rounded-full text-sm font-semibold transition-all border ${
                role === 'member'
                  ? 'border-primary-400 bg-primary-500/80 text-white shadow-md'
                  : 'border-slate-600 bg-slate-900/70 text-slate-100 hover:border-primary-500 hover:text-primary-100'
              }`}
            >
              👤 Daftar sebagai Member
            </button>
            <button
              type="button"
              onClick={() => setRole('admin')}
              className={`p-4 rounded-full text-sm font-semibold transition-all border ${
                role === 'admin'
                  ? 'border-primary-400 bg-primary-500/80 text-white shadow-md'
                  : 'border-slate-600 bg-slate-900/70 text-slate-100 hover:border-primary-500 hover:text-primary-100'
              }`}
            >
              🛠 Daftar sebagai Admin
            </button>
          </div>

          {/* Registration Form */}
          <div className="bg-slate-900/80 border border-slate-700/70 rounded-3xl shadow-xl p-6 md:p-8 text-slate-100 auth-glow auth-glow-strong">
            <h2 className="text-xl font-bold mb-4 text-slate-50">Form {roleTitle}</h2>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-slate-200">Nama Lengkap</label>
              <input 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                type="text" 
                required 
                className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70" 
                placeholder="Nama lengkap Anda" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-200">Email</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70" placeholder="nama@contoh.com" />
            </div>
            <div>
              <label className="text-sm text-slate-200">No. Telepon</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70" placeholder="08xxxxxxxxxxxx" />
            </div>
            {/* Kota/Kabupaten & Instansi untuk semua role */}
            <div>
              <label className="text-sm text-slate-200">Kota/Kabupaten</label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                required
                className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              >
                <option value="">Pilih Kota/Kabupaten</option>
                {KOTA_KABUPATEN_JATIM.map(kota => (
                  <option key={kota} value={kota}>{kota}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-200">Instansi</label>
              <select
                value={instansi}
                onChange={e => setInstansi(e.target.value)}
                required
                className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
              >
                <option value="">Pilih Instansi</option>
                <option value="Dinkes Kabupaten/Kota">Dinkes Kabupaten/Kota</option>
                <option value="Dinkes Provinsi Jatim">Dinkes Provinsi Jatim</option>
              </select>
            </div>
            {role === 'admin' && (
              <div>
                <label className="text-sm text-slate-200">Kode Admin</label>
                <input
                  value={adminCode}
                  onChange={e => setAdminCode(e.target.value)}
                  type="password"
                  className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
                  placeholder="Masukkan kode admin rahasia"
                />
              </div>
            )}
            <div>
              <label className="text-sm text-slate-200">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)} required className="mt-1 w-full border px-3 py-2 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70" placeholder="nama_pengguna" />
            </div>
            <div>
              <label className="text-sm text-slate-200">Password</label>
              <div className="mt-1 relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full border px-3 py-2 pr-10 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
                  placeholder="Minimal 6 karakter"
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
            <div>
              <label className="text-sm text-slate-200">Konfirmasi Password</label>
              <div className="mt-1 relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="w-full border px-3 py-2 pr-10 rounded bg-slate-950/60 text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/70"
                  placeholder="Ulang password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-sm text-slate-400"
                  aria-label={showConfirm ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showConfirm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-red-300 bg-red-900/40 border border-red-700/70 p-3 rounded">{error}</div>}
            <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95 disabled:opacity-60">{loading ? 'Memproses...' : 'Daftar'}</button>
          </form>
          <div className="mt-4 text-sm text-slate-300 flex items-center justify-between">
            <span>Sudah punya akun?</span>
            <Link className="text-primary-300 hover:text-primary-200 font-semibold" to="/login">Login di sini</Link>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
