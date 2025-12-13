import React, { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'

export default function LoginModal() {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useApp()

  useEffect(() => {
    function handler() {
      setOpen(true)
    }
    window.addEventListener('open-login', handler)
    return () => window.removeEventListener('open-login', handler)
  }, [])

  async function submit(e) {
    e.preventDefault()
    const ok = await login(username, password)
    if (ok) {
      setOpen(false)
      setPassword('')
      setError(null)
    } else setError('Credensial salah. Gunakan password: admin')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Silahkan Login</h3>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-300">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border px-3 py-2 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
          </div>
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-300">Password</label>
            <div className="mt-1 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border px-3 py-2 pr-10 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute inset-y-0 right-0 px-3 text-sm text-slate-500 dark:text-slate-300"
                aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          {error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-slate-700 dark:text-slate-200">Batal</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Login</button>
          </div>
        </form>
      </div>
    </div>
  )
}
