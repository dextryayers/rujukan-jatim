import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { initialData } from '../data/sampleData'
import * as API from '../services/api'

const AppContext = createContext()

const PROFILE_PHOTO_TAG = 'profile-photo'

export function useApp() {
  return useContext(AppContext)
}

export function AppProvider({ children }) {
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('mutu-data')
    const parsed = saved ? JSON.parse(saved) : { ...initialData }
    try {
      const storedPhoto = localStorage.getItem('mutu-profile-photo')
      if (storedPhoto) {
        parsed.profilePhoto = JSON.parse(storedPhoto)
      }
    } catch {}
    return parsed
  })

  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('mutu-user')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  })

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('mutu-theme')
    if (saved) return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const [useApi, setUseApi] = useState(() => import.meta.env.VITE_USE_API === 'true')
  const [visitorSession, setVisitorSession] = useState(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('visitor-session')
  })
  const [visitorSummary, setVisitorSummary] = useState(null)
  const [visitorStats, setVisitorStats] = useState([])
  const [activityLogs, setActivityLogs] = useState([])
  const summaryIntervalRef = useRef(null)
  const offlineSyncRef = useRef(false)

  const normalizeVisitorSummary = useCallback(raw => {
    if (!raw || typeof raw !== 'object') return null
    const today = raw.today ?? {}
    return {
      activeNow: Number(raw.active_now ?? 0),
      today: {
        date: today.date ?? null,
        views: Number(today.views ?? 0),
        uniqueVisitors: Number(today.unique_visitors ?? 0),
      },
      updatedAt: new Date().toISOString(),
    }
  }, [])

  function isProfilePhotoDocument(item = {}) {
    if (!item) return false
    const category = (item.category || '').toLowerCase()
    const description = (item.description || '').toLowerCase()
    return category === PROFILE_PHOTO_TAG || description.includes('foto profil admin')
  }

  async function uploadProfilePhoto(file, username = '') {
    if (!file) throw new Error('Tidak ada file foto')

    function applyPhoto(url, fallback = false, meta = {}) {
      const updatedUser = { ...(user || {}), photoUrl: url, photoOfflineFallback: fallback }
      setUser(updatedUser)
      try {
        localStorage.setItem('mutu-user', JSON.stringify(updatedUser))
      } catch {}

      const nextPhoto = {
        url,
        offlineFallback: fallback,
        updatedAt: new Date().toISOString(),
        ...meta,
      }
      setData(prev => ({
        ...prev,
        profilePhoto: nextPhoto,
      }))
      try {
        localStorage.setItem('mutu-profile-photo', JSON.stringify(nextPhoto))
      } catch {}
      return url
    }

    if (useApi && typeof API.uploadDocument === 'function') {
      const formData = new FormData()
      const title = `Foto Profil ${username || 'Admin'}`.trim()
      const description = `Foto profil admin ${username || ''}`.trim()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('file', file)
      formData.append('category', PROFILE_PHOTO_TAG)
      try {
        const res = await API.uploadDocument(formData)
        const url = res.photo_url || res.photoUrl || res.file_url || res.fileUrl
        if (url) {
          applyPhoto(url, false, {
            fileName: res.file_name || res.fileName || file.name,
            mimeType: res.mime_type || res.mimeType || file.type,
            fileSize: res.file_size || res.fileSize || file.size,
            documentId: res.id,
          })
        }
        return url
      } catch (err) {
        console.warn('Upload foto profil via API gagal, memakai fallback lokal.', err)
      }
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = e => reject(e || new Error('Pembacaan foto gagal'))
      reader.onload = () => {
        const base64 = reader.result
        applyPhoto(base64, true)
        resolve(base64)
      }
      reader.readAsDataURL(file)
    })
  }

  const refreshVisitorSummary = useCallback(async () => {
    if (!useApi || typeof API.getVisitorSummary !== 'function') return null
    try {
      const res = await API.getVisitorSummary()
      const summary = normalizeVisitorSummary(res)
      if (summary) setVisitorSummary(summary)
      return summary
    } catch (err) {
      console.warn('Gagal memuat ringkasan pengunjung', err)
      return null
    }
  }, [useApi, normalizeVisitorSummary])

  const trackVisitor = useCallback(async (countView = false) => {
    if (!useApi || typeof API.trackVisitor !== 'function') return null
    if (typeof window === 'undefined') return null

    try {
      const storedSession = visitorSession || localStorage.getItem('visitor-session')
      const res = await API.trackVisitor({ sessionId: storedSession ?? undefined, countView })
      if (res?.session_id) {
        localStorage.setItem('visitor-session', res.session_id)
        setVisitorSession(res.session_id)
      }
      const summary = normalizeVisitorSummary(res)
      if (summary) setVisitorSummary(summary)
      return summary
    } catch (err) {
      console.warn('Gagal mencatat pengunjung', err)
      return null
    }
  }, [useApi, visitorSession, normalizeVisitorSummary])

  const fetchVisitorStats = useCallback(async (days = 14) => {
    if (!useApi || typeof API.getVisitorStats !== 'function') return []
    try {
      const res = await API.getVisitorStats(days)
      if (Array.isArray(res)) {
        const mapped = res.map(item => ({
          date: item.date,
          views: Number(item.views ?? 0),
          uniqueVisitors: Number(item.unique_visitors ?? 0),
        }))
        setVisitorStats(mapped)
        return mapped
      }
    } catch (err) {
      console.warn('Gagal memuat statistik pengunjung', err)
    }
    return []
  }, [useApi])

  useEffect(() => {
    if (!useApi) return () => {}
    if (summaryIntervalRef.current) clearInterval(summaryIntervalRef.current)
    summaryIntervalRef.current = setInterval(() => {
      refreshVisitorSummary()
    }, 30000)
    return () => {
      if (summaryIntervalRef.current) clearInterval(summaryIntervalRef.current)
    }
  }, [useApi, refreshVisitorSummary])

  const fetchActivityLogs = useCallback(async (limit = 20) => {
    if (!useApi || typeof API.getActivityLogs !== 'function') return []
    try {
      const res = await API.getActivityLogs(limit)
      if (Array.isArray(res)) {
        const mapped = res.map(item => ({
          id: item.id,
          type: item.type,
          description: item.description,
          createdAt: item.created_at,
          metadata: item.metadata ?? {},
          user: item.user ?? null,
        }))
        setActivityLogs(mapped)
        return mapped
      }
    } catch (err) {
      console.warn('Gagal memuat log aktivitas', err)
    }
    return []
  }, [useApi])

  useEffect(() => {
    if (!useApi) {
      localStorage.setItem('mutu-data', JSON.stringify(data))
    } else {
      try {
        const serializable = { ...data, documents: data.documents?.filter(doc => !doc.offlineFallback) }
        localStorage.setItem('mutu-data', JSON.stringify(serializable))
      } catch {}
    }
  }, [data, useApi])

  useEffect(() => {
    async function loadFromApi() {
      if (!useApi) return
      try {
        const [akr, inds, docs] = await Promise.all([
          typeof API.getAkreditasi === 'function' ? API.getAkreditasi() : null,
          typeof API.getIndikators === 'function' ? API.getIndikators() : [],
          typeof API.getDocuments === 'function' ? API.getDocuments() : [],
        ])

        setData(prev => ({
          ...prev,
          akreditasi: akr && typeof akr === 'object'
            ? {
                paripurna: Number(akr.paripurna ?? prev.akreditasi?.paripurna ?? 0),
                utama: Number(akr.utama ?? prev.akreditasi?.utama ?? 0),
                madya: Number(akr.madya ?? prev.akreditasi?.madya ?? 0),
                recordedAt: akr.recorded_at ?? prev.akreditasi?.recordedAt ?? null,
              }
            : prev.akreditasi,
          indikators: Array.isArray(inds)
            ? inds.map(item => ({
                id: item.id,
                name: item.name,
                region: item.region ?? null,
                capaian: Number(item.capaian ?? 0),
                target: Number(item.target ?? 0),
                status: item.status ?? (Number(item.capaian ?? 0) >= Number(item.target ?? 0) ? 'Mencapai Target' : 'Tidak Mencapai Target'),
                date: item.date ?? null,
              }))
            : prev.indikators,
          documents: Array.isArray(docs)
            ? docs
                .filter(item => !isProfilePhotoDocument(item))
                .map(item => ({
                id: item.id,
                title: item.title,
                description: item.description ?? '',
                fileUrl: item.file_url || item.fileUrl,
                fileName: item.file_name,
                mimeType: item.mime_type,
                fileSize: item.file_size,
              }))
            : prev.documents,
        }))
        await Promise.all([trackVisitor(true), refreshVisitorSummary()])
        fetchVisitorStats()
        fetchActivityLogs()
      } catch (e) {
        console.warn('Gagal mengambil data dari API, mempertahankan data lokal.', e)
      }
    }
    loadFromApi()
  }, [useApi, trackVisitor, refreshVisitorSummary, fetchVisitorStats, fetchActivityLogs])

  useEffect(() => {
    async function initUser() {
      if (useApi) {
        const token = localStorage.getItem('mutu-token')
        if (token) {
          try {
            const me = await API.me()
            // me already contains id, username, role, email, phone
            setUser(me)
          } catch {}
        }
        trackVisitor()
        refreshVisitorSummary()
      } else {
        const saved = localStorage.getItem('mutu-user')
        if (saved) {
          try {
            setUser(JSON.parse(saved))
          } catch {
            setUser({ username: saved })
          }
        }
      }
    }
    initUser()
  }, [useApi, trackVisitor, refreshVisitorSummary])

  useEffect(() => {
    localStorage.setItem('mutu-theme', theme)
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  async function login(email, password, recaptchaToken) {
    if (!useApi || typeof API.login !== 'function') return false
    const res = await API.login(email, password, recaptchaToken)
    if (res && res.user) {
      setUser(res.user)
      localStorage.setItem('mutu-user', JSON.stringify(res.user))
      return true
    }
    return false
  }

  async function register(username, password, email, phone, role = 'member', nik, fullName, city, instansi, recaptchaToken, loginRecaptchaToken, adminCode) {
    if (!useApi || typeof API.register !== 'function') return false

    const payload = {
      username,
      password,
      email,
      phone,
      role,
      full_name: fullName,
      city,
      institution: instansi,
    }
    if (role === 'admin' && recaptchaToken) {
      payload.recaptcha_token = recaptchaToken
      if (adminCode) payload.admin_code = adminCode
    }

    const res = await API.register(payload)
    if (res && res.user) {
      setUser(res.user)
      localStorage.setItem('mutu-user', JSON.stringify(res.user))
      return true
    }

    if (loginRecaptchaToken && typeof API.login === 'function') {
      const loginRes = await API.login(email, password, loginRecaptchaToken)
      if (loginRes && loginRes.user) {
        setUser(loginRes.user)
        localStorage.setItem('mutu-user', JSON.stringify(loginRes.user))
        return true
      }
    }

    return false
  }

  async function logout() {
    if (useApi && typeof API.logout === 'function') {
      try {
        await API.logout()
      } catch (err) {
        console.warn('Logout API failed', err)
      }
    }
    localStorage.removeItem('mutu-user')
    localStorage.removeItem('mutu-token')
    setUser(null)
  }

  function toggleTheme() {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // API-aware helpers (fallback to local update if API unavailable)
  async function saveAkreditasi(next) {
    if (useApi && typeof API.updateAkreditasi === 'function') {
      const res = await API.updateAkreditasi(next)
      setData(prev => ({
        ...prev,
        akreditasi: {
          paripurna: Number(res.paripurna ?? prev.akreditasi?.paripurna ?? 0),
          utama: Number(res.utama ?? prev.akreditasi?.utama ?? 0),
          madya: Number(res.madya ?? prev.akreditasi?.madya ?? 0),
          recordedAt: res.recorded_at ?? prev.akreditasi?.recordedAt ?? null,
        },
      }))
    } else {
      setData(prev => ({ ...prev, akreditasi: { ...next } }))
    }
  }

  async function createIndicator(name = 'New indikator', capaian = 0, target = 100, date = null, region = null) {
    if (useApi && typeof API.createIndicator === 'function') {
      const created = await API.createIndicator({ name, region, capaian, target, date })
      setData(prev => ({
        ...prev,
        indikators: [
          ...prev.indikators,
          {
            id: created.id,
            name: created.name,
            region: created.region ?? null,
            capaian: Number(created.capaian ?? 0),
            target: Number(created.target ?? 0),
            status: created.status ?? (Number(created.capaian ?? 0) >= Number(created.target ?? 0) ? 'Mencapai Target' : 'Tidak Mencapai Target'),
            date: created.date ?? null,
          },
        ],
      }))
    } else {
      const id = Date.now()
      const status = Number(capaian) >= Number(target) ? 'Mencapai Target' : 'Tidak Mencapai Target'
      const row = { id, name, region, capaian, target, status, date }
      setData(prev => ({ ...prev, indikators: [...prev.indikators, row] }))
    }
  }

  async function updateIndicatorRow({ id, name, capaian, target, date = null, status, region = null }) {
    if (useApi && typeof API.updateIndicator === 'function') {
      const updated = await API.updateIndicator(id, { name, region, capaian, target, date, status })
      setData(prev => ({
        ...prev,
        indikators: prev.indikators.map(i => {
          if (i.id !== updated.id) return i
          return {
            id: updated.id,
            name: updated.name,
            region: updated.region ?? null,
            capaian: Number(updated.capaian ?? 0),
            target: Number(updated.target ?? 0),
            status: updated.status ?? (Number(updated.capaian ?? 0) >= Number(updated.target ?? 0) ? 'Mencapai Target' : 'Tidak Mencapai Target'),
            date: updated.date ?? null,
          }
        }),
      }))
    } else {
      const computedStatus = status || (Number(capaian) >= Number(target) ? 'Mencapai Target' : 'Tidak Mencapai Target')
      setData(prev => ({
        ...prev,
        indikators: prev.indikators.map(i => (i.id === id
          ? { ...i, name, region, capaian, target, status: computedStatus, date }
          : i)),
      }))
    }
  }

  async function removeIndicator(id) {
    if (useApi && typeof API.deleteIndicator === 'function') {
      await API.deleteIndicator(id)
    }
    setData(prev => ({ ...prev, indikators: prev.indikators.filter(i => i.id !== id) }))
  }

  async function replaceIndicators(items) {
    if (useApi && typeof API.replaceIndicators === 'function') {
      const replaced = await API.replaceIndicators(items)
      setData(prev => ({
        ...prev,
        indikators: replaced.map(item => ({
          id: item.id,
          name: item.name,
          region: item.region ?? null,
          capaian: Number(item.capaian ?? 0),
          target: Number(item.target ?? 0),
          status: item.status ?? (Number(item.capaian ?? 0) >= Number(item.target ?? 0) ? 'Mencapai Target' : 'Tidak Mencapai Target'),
          date: item.date ?? null,
        })),
      }))
    } else {
      const mapped = items.map((r, idx) => {
        const name = r.name || `Indikator ${idx + 1}`
        const capaian = Number(r.capaian ?? 0)
        const target = Number(r.target ?? 100)
        const status = capaian >= target ? 'Mencapai Target' : 'Tidak Mencapai Target'
        const date = r.date ?? null
        return { id: Date.now() + idx, name, capaian, target, status, date }
      })
      setData(prev => ({ ...prev, indikators: mapped }))
    }
  }

  async function uploadDocument(file, title, description) {
    const normalizedTitle = title || file?.name || 'Dokumen Tanpa Judul'

    function pushDocument(doc) {
      setData(prev => ({
        ...prev,
        documents: [doc, ...prev.documents],
      }))
      return doc
    }

    const createLocalDocument = (offline, error) => new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('File tidak ditemukan'))
        return
      }
      const reader = new FileReader()
      reader.onerror = err => reject(err || new Error('Pembacaan file gagal'))
      reader.onload = () => {
        const base64 = reader.result
        const newDoc = {
          id: Date.now(),
          title: normalizedTitle,
          description: description || '',
          fileUrl: base64,
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          category: PROFILE_PHOTO_TAG,
          offlineFallback: Boolean(offline),
          syncError: error ? (error.message || String(error)) : null,
          createdAt: new Date().toISOString(),
        }
        resolve(pushDocument(newDoc))
      }
      reader.readAsDataURL(file)
    })

    if (useApi && typeof API.uploadDocument === 'function') {
      const formData = new FormData()
      formData.append('title', normalizedTitle)
      if (description) formData.append('description', description)
      formData.append('file', file)
      try {
        const doc = await API.uploadDocument(formData)
        const storedDoc = {
          id: doc.id,
          title: doc.title ?? normalizedTitle,
          description: doc.description ?? description ?? '',
          fileUrl: doc.file_url || doc.fileUrl,
          fileName: doc.file_name || file?.name,
          mimeType: doc.mime_type || file?.type,
          fileSize: doc.file_size || file?.size,
          offlineFallback: false,
          syncError: null,
          syncedAt: new Date().toISOString(),
        }
        return pushDocument(storedDoc)
      } catch (err) {
        console.warn('Upload document via API gagal, menggunakan fallback lokal.', err)
        return createLocalDocument(true, err)
      }
    }

    const reason = useApi
      ? new Error('Endpoint upload dokumen tidak tersedia atau server sedang offline.')
      : new Error('Mode offline: server API dimatikan.')
    return createLocalDocument(true, reason)
  }

  async function renameDocument(id, updates = {}) {
    if (useApi && typeof API.updateDocument === 'function') {
      const formData = new FormData()
      if (updates.title !== undefined) formData.append('title', updates.title)
      if (updates.description !== undefined) formData.append('description', updates.description)
      const updated = await API.updateDocument(id, formData)
      setData(prev => ({
        ...prev,
        documents: prev.documents.map(d => (d.id === id
          ? {
              id: updated.id,
              title: updated.title,
              description: updated.description ?? '',
              fileUrl: updated.file_url || updated.fileUrl,
              fileName: updated.file_name,
              mimeType: updated.mime_type,
              fileSize: updated.file_size,
              offlineFallback: false,
              syncError: null,
              syncedAt: new Date().toISOString(),
            }
          : d)),
      }))
      return
    }
    setData(prev => ({
      ...prev,
      documents: prev.documents.map(d => {
        if (d.id !== id) return d
        return {
          ...d,
          ...(updates.title !== undefined ? { title: updates.title } : {}),
          ...(updates.description !== undefined ? { description: updates.description } : {}),
        }
      }),
    }))
  }

  async function removeDocument(id) {
    if (useApi && typeof API.deleteDocument === 'function') {
      await API.deleteDocument(id)
    }
    setData(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== id) }))
  }

  const syncOfflineDocument = useCallback(async id => {
    if (!useApi || typeof API.uploadDocument !== 'function') {
      throw new Error('Sinkronisasi memerlukan server API aktif. Pastikan VITE_USE_API="true" dan endpoint /documents tersedia.')
    }

    const target = Array.isArray(data?.documents) ? data.documents.find(doc => doc.id === id) : null
    if (!target) {
      throw new Error('Dokumen tidak ditemukan.')
    }
    if (target.category === PROFILE_PHOTO_TAG) {
      return target
    }
    if (!target.offlineFallback || typeof target.fileUrl !== 'string' || !target.fileUrl.startsWith('data:')) {
      return target
    }

    const response = await fetch(target.fileUrl)
    const blob = await response.blob()
    const formData = new FormData()
    const title = target.title || target.fileName || 'Dokumen'
    formData.append('title', title)
    if (target.description) {
      formData.append('description', target.description)
    }
    const fileName = target.fileName || `${title.replace(/\s+/g, '-')}.bin`
    formData.append('file', blob, fileName)

    try {
      const saved = await API.uploadDocument(formData)
      setData(prev => ({
        ...prev,
        documents: prev.documents.map(doc => {
          if (doc.id !== target.id) return doc
          return {
            id: saved.id,
            title: saved.title ?? title,
            description: saved.description ?? target.description ?? '',
            fileUrl: saved.file_url || saved.fileUrl,
            fileName: saved.file_name || fileName,
            mimeType: saved.mime_type || blob.type || target.mimeType,
            fileSize: saved.file_size || blob.size || target.fileSize,
            offlineFallback: false,
            syncError: null,
            syncedAt: new Date().toISOString(),
          }
        }),
      }))
      return saved
    } catch (err) {
      const message = err?.message || 'Sinkronisasi dokumen gagal.'
      setData(prev => ({
        ...prev,
        documents: prev.documents.map(doc => (doc.id === target.id ? { ...doc, syncError: message } : doc)),
      }))
      throw err
    }
  }, [useApi, data?.documents])

  useEffect(() => {
    if (!useApi) return
    if (!Array.isArray(data?.documents) || data.documents.length === 0) return
    if (offlineSyncRef.current) return

    const pending = data.documents.filter(doc => doc?.offlineFallback && typeof doc.fileUrl === 'string' && doc.fileUrl.startsWith('data:'))
    if (pending.length === 0) return

    offlineSyncRef.current = true

    let cancelled = false

    const sync = async () => {
      for (const pendingDoc of pending) {
        if (cancelled) break
        try {
          await syncOfflineDocument(pendingDoc.id)
        } catch (err) {
          console.warn('Sinkronisasi dokumen offline gagal', err)
        }
      }
    }

    sync().finally(() => {
      offlineSyncRef.current = false
    })

    return () => {
      cancelled = true
    }
  }, [useApi, data?.documents, syncOfflineDocument])

  async function getUsers() {
    if (useApi && typeof API.getUsers === 'function') {
      return API.getUsers()
    }
    return []
  }

  async function deleteUser(id) {
    if (useApi && typeof API.deleteUser === 'function') {
      return API.deleteUser(id)
    }
    return null
  }

  async function updateUser(id, payload) {
    if (useApi && typeof API.updateUser === 'function') {
      return API.updateUser(id, payload)
    }
    return null
  }

  async function createAdminUser({ username, password, email, phone, fullName, city, instansi }, recaptchaToken) {
    if (useApi && typeof API.createAdminUser === 'function') {
      return API.createAdminUser({ username, password, email, phone, fullName, city, instansi }, recaptchaToken)
    }
    return null
  }

  async function createMemberUser({ username, password, email, phone, fullName, city, instansi }, recaptchaToken) {
    if (useApi && typeof API.register === 'function') {
      return API.register(
        username,
        password,
        email,
        phone,
        'member',
        null,
        fullName,
        city || null,
        instansi || null,
        recaptchaToken
      )
    }
    return null
  }

  async function updateProfile(updates) {
    if (useApi && typeof API.updateProfile === 'function') {
      const me = await API.updateProfile(updates)
      setUser(me)
      return me
    }
    return null
  }

  const value = {
    data,
    setData, 
    user,
    login,
    register,
    logout,
    theme,
    toggleTheme,
    useApi,
    saveAkreditasi,
    createIndicator,
    updateIndicatorRow,
    removeIndicator,
    replaceIndicators,
    uploadDocument,
    uploadProfilePhoto,
    renameDocument,
    removeDocument,
    getUsers,
    deleteUser,
    createAdminUser,
    createMemberUser,
    updateUser,
    updateProfile,
    syncOfflineDocument,
    visitorSummary,
    visitorStats,
    activityLogs,
    refreshVisitorSummary,
    fetchVisitorStats,
    fetchActivityLogs,
    trackVisitor,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
