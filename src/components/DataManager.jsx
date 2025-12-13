import React, { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

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

const FILE_ICON_PRESETS = {
  pdf: { icon: '📕', tone: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-200' },
  doc: { icon: '📝', tone: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-200' },
  docx: { icon: '📝', tone: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-200' },
  xls: { icon: '📊', tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200' },
  xlsx: { icon: '📊', tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200' },
  csv: { icon: '📊', tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-200' },
  ppt: { icon: '📈', tone: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200' },
  pptx: { icon: '📈', tone: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-200' },
  png: { icon: '🖼️', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-200' },
  jpg: { icon: '🖼️', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-200' },
  jpeg: { icon: '🖼️', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-200' },
  svg: { icon: '🖼️', tone: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-200' },
  default: { icon: '📄', tone: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-200' },
}

function getFileVisual(ext) {
  if (!ext) return FILE_ICON_PRESETS.default
  const lower = String(ext).toLowerCase()
  return FILE_ICON_PRESETS[lower] || FILE_ICON_PRESETS.default
}

function formatBytes(bytes) {
  const size = Number(bytes)
  if (!size || Number.isNaN(size)) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let idx = 0
  let value = size
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024
    idx += 1
  }
  return `${value.toFixed(idx === 0 ? 0 : value < 10 ? 1 : 0)} ${units[idx]}`
}

function formatDateLabel(value) {
  if (!value) return 'Belum ada catatan waktu'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Belum ada catatan waktu'
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

function getTimestamp(value) {
  if (!value) return 0
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? 0 : time
}

export default function DataManager({ docsOnly = false }) {
  const {
    data,
    createIndicator,
    updateIndicatorRow,
    removeIndicator,
    replaceIndicators,
    uploadDocument,
    renameDocument,
    removeDocument,
    activityLogs = [],
  } = useApp()
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [editingDoc, setEditingDoc] = useState(null)
  const [docForm, setDocForm] = useState({})
  const [docTitle, setDocTitle] = useState('')
  const [docDescription, setDocDescription] = useState('')
  const [docFile, setDocFile] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const importRef = useRef(null)

  function startEdit(row) {
    setEditing(row.id)
    setForm({ ...row })
  }

  async function saveEdit() {
    try {
      await updateIndicatorRow({
        id: editing,
        name: form.name,
        region: form.region || null,
        capaian: form.capaian,
        target: form.target,
        date: form.date,
        status: form.status,
      })
      setEditing(null)
      showAlert('success', 'Berhasil', 'Indikator berhasil disimpan.')
    } catch (err) {
      console.error('Failed to save indicator', err)
      showAlert('error', 'Gagal', 'Gagal menyimpan indikator: ' + (err?.message || 'Server error'))
    }
  }

  async function addIndicator() {
    try {
      const today = new Date()
      const ym = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      await createIndicator('New indikator', 0, 100, ym)
      showAlert('success', 'Berhasil', 'Indikator baru berhasil ditambahkan.')
    } catch (err) {
      console.error('Failed to create indicator', err)
      showAlert('error', 'Gagal', 'Gagal menambahkan indikator: ' + (err?.message || 'Server error'))
    }
  }

  function exportExcel() {
    const ws = XLSX.utils.json_to_sheet(data.indikators)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Indikator')
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buf], { type: 'application/octet-stream' })
    saveAs(blob, 'indikator.xlsx')
  }

  function exportPDF() {
    const doc = new jsPDF()
    doc.text('Daftar Indikator', 10, 10)
    let y = 20
    data.indikators.forEach(i => {
      doc.text(`${i.name} - ${i.capaian}% - ${i.status}`, 10, y)
      y += 8
    })
    doc.save('indikator.pdf')
  }

  function importExcel(e) {
    const f = e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = ev => {
      const u8 = new Uint8Array(ev.target.result)
      const wb = XLSX.read(u8, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json(ws)
      const mapped = json.map((row, idx) => {
        const name = row.name || row.Nama || row.INDIKATOR || row.Indikator || `Indikator ${idx + 1}`
        const capaian = Number(row.capaian ?? row.Capaian ?? row['CAPAIAN (%)'] ?? 0)
        const target = Number(row.target ?? row.Target ?? 100)
        const year = row.year ?? row.Year ?? row.Tahun
        const month = row.month ?? row.Month ?? row.Bulan
        let date = null
        if (year && month) {
          const y = parseInt(year, 10)
          const m = parseInt(month, 10)
          if (!Number.isNaN(y) && !Number.isNaN(m) && m >= 1 && m <= 12) {
            date = `${y}-${String(m).padStart(2, '0')}-01`
          }
        }
        return { name, capaian, target, date }
      })
      replaceIndicators(mapped).then(() => {
        showAlert('success', 'Berhasil', 'Data indikator berhasil diimpor dari Excel.')
      }).catch(err => {
        console.error('Import failed', err)
        showAlert('error', 'Gagal', 'Gagal mengimpor file: ' + (err?.message || 'Server error'))
      })
    }
    reader.readAsArrayBuffer(f)
  }

  function handleFileChange(e) {
    const f = e.target.files[0]
    if (!f) return
    setDocFile(f)
  }

  async function handleDocSubmit(e) {
    e.preventDefault()
    if (!docFile) {
      showAlert('warning', 'File belum dipilih', 'Silakan pilih file dokumen terlebih dahulu.')
      return
    }
    try {
      setUploadingDoc(true)
      await uploadDocument(docFile, docTitle.trim(), docDescription.trim())
      setDocTitle('')
      setDocDescription('')
      setDocFile(null)
      e.target.reset()
      showAlert('success', 'Berhasil', 'Dokumen berhasil diunggah.')
    } catch (err) {
      console.error('Upload document failed', err)
      showAlert('error', 'Gagal', 'Gagal mengunggah dokumen: ' + (err?.message || 'Server error'))
    } finally {
      setUploadingDoc(false)
    }
  }

  const documents = Array.isArray(data?.documents) ? data.documents : []
  const sortedDocuments = React.useMemo(
    () => [...documents].sort((a, b) => getTimestamp(b.updatedAt || b.createdAt) - getTimestamp(a.updatedAt || a.createdAt)),
    [documents],
  )
  const documentActivities = React.useMemo(() => {
    if (!Array.isArray(activityLogs)) return []
    const filtered = activityLogs.filter(log => (log.type || '').toLowerCase().includes('doc'))
    return filtered.slice(0, 4)
  }, [activityLogs])

  if (docsOnly) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-primary-200/60 bg-gradient-to-br from-primary-100/80 via-white to-primary-200/60 p-6 shadow-md shadow-primary-100/40 dark:border-primary-500/40 dark:from-primary-950/60 dark:via-slate-900/70 dark:to-primary-900/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Konsol Dokumen</p>
              <h3 className="text-2xl font-bold text-primary-900 dark:text-primary-100">Distribusi &amp; Arsip Terkurasi</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                Unggah dokumen akreditasi, SOP, serta pedoman mutu dengan pengalaman ala drive premium. Sistem kami menambahkan fingerprint digital agar setiap revisi tetap terpantau.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-3 py-1 text-primary-700 shadow-sm dark:border-primary-700/50 dark:bg-primary-900/30 dark:text-primary-100">
                📁 {sortedDocuments.length} File aktif
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-primary-50/80 px-3 py-1 text-primary-700 shadow-sm dark:border-primary-500/40 dark:bg-primary-900/30 dark:text-primary-100">
                🛡️ Versi terlacak otomatis
              </span>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleDocSubmit}
          className="rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-lg shadow-slate-200/30 dark:border-slate-700/60 dark:bg-slate-900/80"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Unggah dokumen baru</h4>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gunakan format PDF, Office, atau gambar berekstensi JPG/PNG.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/60 bg-slate-50/70 px-3 py-1 shadow-sm dark:border-slate-700/40 dark:bg-slate-800/40">{docFile ? `Siap unggah: ${docFile.name}` : 'Belum ada file dipilih'}</span>
              {uploadingDoc && <span className="inline-flex items-center gap-2 rounded-full bg-primary-100 px-3 py-1 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:text-primary-100">Sedang mengunggah...</span>}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr,1fr]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Judul Dokumen</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={e => setDocTitle(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-inner shadow-slate-200/40 transition focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                    placeholder="Contoh: Kebijakan Mutu 2025"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Deskripsi singkat</label>
                  <input
                    type="text"
                    value={docDescription}
                    onChange={e => setDocDescription(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 text-sm shadow-inner shadow-slate-200/40 transition focus:border-primary-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100"
                    placeholder="Opsional: isi ringkasan, nomor kebijakan, atau tag"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Lampiran dokumen</label>
                <label
                  htmlFor="doc-file-upload"
                  className="relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/80 px-6 py-8 text-center text-slate-500 shadow-inner transition hover:border-primary-400 hover:bg-primary-50/60 dark:border-slate-600 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
                >
                  <input
                    id="doc-file-upload"
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.svg"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-2xl text-primary-600 shadow-sm dark:bg-primary-900/40 dark:text-primary-200">📤</span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Seret &amp; lepaskan file Anda</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">atau klik untuk memilih dari perangkat</p>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400 dark:text-slate-500">Maks 50MB · PDF / Office / Gambar</p>
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50/90 via-white to-slate-100/80 p-4 shadow-inner dark:border-slate-700/60 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/40">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Audit unggahan</p>
              <ul className="mt-3 space-y-2 text-sm">
                {documentActivities.length > 0 ? (
                  documentActivities.map(log => (
                    <li
                      key={`doc-activity-${log.id}`}
                      className="rounded-2xl border border-primary-200/50 bg-white/90 px-3 py-2 text-slate-700 shadow-sm dark:border-primary-500/30 dark:bg-primary-950/30 dark:text-primary-100"
                    >
                      <p className="text-[11px] uppercase tracking-[0.18em] text-primary-500">
                        {(log.type || 'Aktivitas').replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-semibold">{log.description || 'Perubahan dokumen'}</p>
                      <span className="text-[10px] text-slate-500 dark:text-slate-300">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('id-ID') : 'Baru saja'}
                      </span>
                    </li>
                  ))
                ) : (
                  <li className="rounded-2xl border border-dashed border-slate-200/70 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                    Belum ada histori khusus dokumen.
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              disabled={uploadingDoc}
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="text-lg">⬆</span>
              {uploadingDoc ? 'Mengunggah...' : 'Publikasikan Dokumen'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDocTitle('')
                setDocDescription('')
                setDocFile(null)
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 px-5 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            >
              Reset Form
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedDocuments.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200/70 bg-white/95 p-6 text-center text-sm text-slate-500 shadow-inner dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-400">
              Belum ada dokumen tersimpan. Mulai dengan mengunggah file pertama Anda.
            </div>
          )}
          {sortedDocuments.map(doc => {
            const extension = doc.fileName?.split('.').pop() || doc.mimeType?.split('/').pop()
            const visual = getFileVisual(extension)
            const lastUpdated = doc.updatedAt || doc.createdAt || doc.uploadedAt
            const isEditing = editingDoc === doc.id
            return (
              <div
                key={doc.id}
                className="group relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/95 p-5 shadow-lg shadow-slate-200/30 transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-2xl dark:border-slate-700/60 dark:bg-slate-900/80"
              >
                <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary-500/10 blur-3xl" />
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-semibold ${visual.tone}`}>
                      {visual.icon}
                    </div>
                    <div className="space-y-2">
                      {isEditing ? (
                        <>
                          <input
                            value={docForm.title}
                            onChange={e => setDocForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
                          />
                          <textarea
                            value={docForm.description || ''}
                            onChange={e => setDocForm(f => ({ ...f, description: e.target.value }))}
                            className="w-full rounded-2xl border border-slate-200/70 bg-white/90 px-3 py-2 text-sm shadow-inner dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-100"
                            rows={3}
                          />
                        </>
                      ) : (
                        <>
                          <h5 className="text-base font-semibold text-slate-900 dark:text-slate-100">{doc.title}</h5>
                          {doc.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 whitespace-pre-line">{doc.description}</p>
                          )}
                        </>
                      )}
                      <div className="flex flex-wrap gap-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          {extension ? extension.toUpperCase() : 'FILE'}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          {formatBytes(doc.fileSize)}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-800/60">
                          {formatDateLabel(lastUpdated)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <a
                      href={doc.fileUrl}
                      download
                      className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-700"
                    >
                      ⬇ Unduh
                    </a>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              await renameDocument(doc.id, { title: docForm.title, description: docForm.description })
                              setEditingDoc(null)
                              showAlert('success', 'Berhasil', 'Informasi dokumen berhasil diperbarui.')
                            } catch (err) {
                              showAlert('error', 'Gagal', 'Gagal menyimpan perubahan dokumen: ' + (err?.message || 'Server error'))
                            }
                          }}
                          className="rounded-full border border-primary-200/70 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-50 dark:border-primary-500/40 dark:text-primary-200 dark:hover:bg-primary-900/30"
                        >
                          Simpan
                        </button>
                        <button
                          onClick={() => setEditingDoc(null)}
                          className="rounded-full border border-slate-200/70 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingDoc(doc.id)
                            setDocForm({ ...doc })
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-primary-200/70 px-3 py-1 text-xs font-semibold text-primary-600 transition hover:border-primary-300 hover:bg-primary-50 dark:border-primary-500/40 dark:text-primary-200 dark:hover:bg-primary-900/30"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={async () => {
                            const confirmed = await showConfirm('Hapus Dokumen', `Anda yakin ingin menghapus dokumen "${doc.title}"? Tindakan ini tidak dapat dibatalkan.`)
                            if (!confirmed) return
                            try {
                              await removeDocument(doc.id)
                              showAlert('success', 'Berhasil', 'Dokumen berhasil dihapus.')
                            } catch (err) {
                              showAlert('error', 'Gagal', 'Gagal menghapus dokumen: ' + (err?.message || 'Server error'))
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-rose-200/70 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 dark:border-rose-500/40 dark:text-rose-200 dark:hover:bg-rose-900/30"
                        >
                          🗑️ Hapus
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg">Table Data Editor</h3>
      <div className="mt-4 flex flex-wrap gap-3 items-center">
        <button onClick={addIndicator} className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Tambah Indikator</button>
        <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={importExcel} className="hidden" />
        <button onClick={() => importRef.current && importRef.current.click()} className="px-3 py-2 border rounded-full text-sm dark:border-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Impor Excel</button>
        <button onClick={exportExcel} className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Export Excel</button>
        <button onClick={exportPDF} className="px-3 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform active:scale-95">Export PDF</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-slate-50 dark:bg-slate-900/60">
            <tr>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Nama</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Kab/Kota</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Capaian</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Target</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Periode</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Status</th>
              <th className="py-2 text-left text-slate-700 dark:text-slate-200">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.indikators.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/70 transition-colors">
                <td className="py-2">
                  {editing === row.id ? (
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.name}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <select
                      value={form.region || ''}
                      onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                      className="border px-2 py-1 rounded w-48 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    >
                      <option value="">Pilih Kab/Kota (opsional)</option>
                      {KOTA_KABUPATEN_JATIM.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.region || '-'}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input type="number" value={form.capaian} onChange={e => setForm(f => ({ ...f, capaian: Number(e.target.value) }))} className="border px-2 py-1 rounded w-24 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700" />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.capaian}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input
                      type="number"
                      value={form.target}
                      onChange={e => setForm(f => ({ ...f, target: Number(e.target.value) }))}
                      className="border px-2 py-1 rounded w-24 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.target}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <input
                      type="month"
                      value={form.date ? String(form.date).slice(0, 7) : ''}
                      onChange={e => {
                        const v = e.target.value
                        setForm(f => ({ ...f, date: v ? `${v}-01` : null }))
                      }}
                      className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700"
                    />
                  ) : (
                    <span className="text-slate-700 dark:text-slate-300">
                      {row.date ? new Date(row.date).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : '-'}
                    </span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="border px-2 py-1 rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700">
                      <option>Mencapai Target</option>
                      <option>Tidak Mencapai Target</option>
                    </select>
                  ) : (
                    <span className="text-slate-900 dark:text-slate-100">{row.status}</span>
                  )}
                </td>
                <td className="py-2">
                  {editing === row.id ? (
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className="px-2 py-1 bg-primary-600 text-white rounded">Simpan</button>
                      <button onClick={() => setEditing(null)} className="px-2 py-1 border rounded dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Batal</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(row)} className="px-2 py-1 bg-primary-50 dark:bg-primary-900/30 dark:text-primary-200 rounded">Edit</button>
                      <button
                        onClick={async () => {
                          const confirmed = await showConfirm('Hapus Indikator', `Anda yakin ingin menghapus indikator "${row.name}"?`)
                          if (!confirmed) return
                          try {
                            await removeIndicator(row.id)
                            showAlert('success', 'Berhasil', 'Indikator berhasil dihapus.')
                          } catch (err) {
                            showAlert('error', 'Gagal', 'Gagal menghapus indikator: ' + (err?.message || 'Server error'))
                          }
                        }}
                        className="px-2 py-1 bg-red-50 dark:bg-red-900/30 dark:text-red-200 rounded"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
