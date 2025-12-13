import React, { useState, useEffect } from 'react'
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

function showAlert(icon, title, text) {
  if (window.Swal) {
    window.Swal.fire({ icon, title, text })
  } else {
    alert(`${title}\n${text || ''}`)
  }
}

async function showConfirm(title, text) {
  if (window.Swal) {
    const result = await window.Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: 'Ya, lanjutkan',
      cancelButtonText: 'Batal',
      reverseButtons: true,
    })
    return result.isConfirmed
  }
  return confirm(text || title)
}

export default function UserManagement() {
  const { getUsers, deleteUser, updateUser } = useApp()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getUsers()
      if (response && Array.isArray(response)) {
        setUsers(response)
        setError(null)
      } else {
        setError('Gagal memuat daftar pengguna')
      }
    } catch (err) {
      setError('Kesalahan: ' + (err.message || 'Tidak dapat memuat pengguna'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, username) => {
    const confirmed = await showConfirm('Hapus Pengguna', `Anda yakin ingin menghapus pengguna "${username}"? Tindakan ini tidak dapat dibatalkan.`)
    if (!confirmed) return
    try {
      setDeleting(id)
      const ok = await deleteUser(id)
      if (ok) {
        setUsers(users.filter(u => u.id !== id))
        showAlert('success', 'Berhasil', 'Pengguna berhasil dihapus.')
      } else {
        showAlert('error', 'Gagal', 'Gagal menghapus pengguna.')
      }
    } catch (err) {
      showAlert('error', 'Error', err?.message || 'Terjadi kesalahan saat menghapus pengguna.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className="text-center py-8">Memuat pengguna...</div>

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Manajemen Pengguna</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal('member')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95"
          >
            + Buat Member
          </button>
          <button
            onClick={() => setShowCreateModal('admin')}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95"
          >
            + Buat Admin
          </button>
        </div>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">{error}</div>}

      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Username</th>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">No. Telepon</th>
              <th className="px-4 py-2">Instansi</th>
              <th className="px-4 py-2">Kota/Kabupaten</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/70 transition-colors">
                <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{user.id}</td>
                <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{user.username}</td>
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{user.email || '-'}</td>
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{user.phone || '-'}</td>
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{user.instansi || '-'}</td>
                <td className="px-4 py-2 text-slate-800 dark:text-slate-200">{user.city || '-'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-2 flex gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-full shadow-sm hover:shadow-md transition-transform active:scale-95"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    disabled={deleting === user.id}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-xs rounded-full shadow-sm hover:shadow-md transition-transform active:scale-95"
                  >
                    {deleting === user.id ? 'Hapus...' : 'Hapus'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && <p className="text-center py-4 text-slate-600 dark:text-slate-300">Tidak ada pengguna</p>}

      {/* Create User Modals */}
      {showCreateModal === 'admin' && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchUsers(); }}
        />
      )}
      {showCreateModal === 'member' && (
        <CreateMemberModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); fetchUsers(); }}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={(updated) => {
            setEditingUser(null)
            if (updated) {
              setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)))
            } else {
              fetchUsers()
            }
          }}
        />
      )}
    </div>
  )
}

function EditUserModal({ user, onClose, onSuccess }) {
  const { updateUser } = useApp()
  const [form, setForm] = useState({
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'member',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { email: form.email, phone: form.phone, role: form.role }
      if (form.password) payload.password = form.password
      const updated = await updateUser(user.id, payload)
      showAlert('success', 'Berhasil', 'Data pengguna berhasil diperbarui.')
      onSuccess(updated)
    } catch (err) {
      setError(err?.message || 'Gagal memperbarui pengguna')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Edit Pengguna: {user.username}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {user.nik && (
            <div>
              <label className="text-sm text-slate-700 dark:text-slate-200 block mb-1">NIK</label>
              <input
                type="text"
                value={user.nik}
                disabled
                className="w-full px-3 py-2 border rounded bg-slate-100 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700 opacity-80"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">NIK tidak dapat diubah.</p>
            </div>
          )}
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200 block mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200 block mb-1">No. Telepon</label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200 block mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            >
              <option value="admin">admin</option>
              <option value="member">member</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-700 dark:text-slate-200 block mb-1">Password Baru (opsional)</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
            />
          </div>
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded disabled:opacity-50">
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateAdminModal({ onClose, onSuccess }) {
  const { createAdminUser } = useApp()
  const [form, setForm] = useState({ username: '', password: '', email: '', phone: '', fullName: '', city: '', instansi: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const getRecaptchaToken = useRecaptcha('create_admin')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || form.fullName.trim() === '') {
      setError('Nama lengkap wajib diisi')
      return
    }
    if (!form.city) {
      setError('Kota/Kabupaten wajib diisi')
      return
    }
    if (!form.instansi) {
      setError('Instansi wajib diisi')
      return
    }
    if (!form.city) {
      setError('Kota/Kabupaten wajib diisi')
      return
    }
    if (!form.instansi) {
      setError('Instansi wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken()
      if (!recaptchaToken) {
        throw new Error('Validasi keamanan gagal, coba lagi.')
      }
      
      const result = await createAdminUser({ 
        ...form, 
        fullName: form.fullName.trim(),
        city: form.city,
        instansi: form.instansi
      }, recaptchaToken)
      if (result) {
        showAlert('success', 'Berhasil', 'Admin baru berhasil dibuat.')
        onSuccess()
      } else {
        setError('Gagal membuat admin')
      }
    } catch (err) {
      setError(err.message || 'Gagal membuat admin')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Buat Admin Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="tel"
            placeholder="No. Telepon"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded disabled:opacity-50">
              {loading ? 'Membuat...' : 'Buat Admin'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateMemberModal({ onClose, onSuccess }) {
  const { createMemberUser } = useApp()
  const [form, setForm] = useState({ username: '', password: '', email: '', phone: '', fullName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const getRecaptchaToken = useRecaptcha('register')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.fullName || form.fullName.trim() === '') {
      setError('Nama lengkap wajib diisi')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Get reCAPTCHA token
      const recaptchaToken = await getRecaptchaToken()
      if (!recaptchaToken) {
        throw new Error('Validasi keamanan gagal, coba lagi.')
      }
      
      const result = await createMemberUser({ ...form, fullName: form.fullName.trim() }, recaptchaToken)
      if (result) {
        showAlert('success', 'Berhasil', 'Member baru berhasil dibuat.')
        onSuccess()
      } else {
        setError('Gagal membuat member')
      }
    } catch (err) {
      setError(err.message || 'Gagal membuat member')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded p-6 w-full max-w-md">
        <h3 className="text-lg font-bold mb-4">Buat Member Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Nama Lengkap"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <input
            type="tel"
            placeholder="No. Telepon"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          <select
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          >
            <option value="">Pilih Kota/Kabupaten</option>
            {KOTA_KABUPATEN_JATIM.map(kota => (
              <option key={kota} value={kota}>{kota}</option>
            ))}
          </select>
          <select
            value={form.instansi}
            onChange={(e) => setForm({ ...form, instansi: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          >
            <option value="">Pilih Instansi</option>
            <option value="Dinkes Kabupaten/Kota">Dinkes Kabupaten/Kota</option>
            <option value="Dinkes Provinsi Jatim">Dinkes Provinsi Jatim</option>
          </select>
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            className="w-full px-3 py-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
          />
          {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded disabled:opacity-50">
              {loading ? 'Membuat...' : 'Buat Member'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded">
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
