import React from 'react'
import { useApp } from '../context/AppContext'

function DocCard({ doc }) {
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 rounded-xl shadow-sm hover:shadow-lg border border-slate-100 dark:border-slate-700 p-4 flex flex-col items-start transition hover:-translate-y-1">
      <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">{doc.icon || '📄'}</div>
      <h4 className="font-semibold mt-2 text-slate-900 dark:text-slate-100">{doc.title}</h4>
      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{doc.description || 'Dokumen resmi untuk referensi dan pembinaan mutu.'}</p>
      <div className="mt-4 w-full flex justify-end">
        <a
          href={doc.fileUrl}
          download
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform duration-150 hover:-translate-y-0.5"
        >
          📥 Download
        </a>
      </div>
    </div>
  )
}

export default function DownloadSection() {
  const { data } = useApp()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 section-glow">
      {data.documents.map(doc => (
        <DocCard key={doc.id} doc={doc} />
      ))}
    </div>
  )
}
