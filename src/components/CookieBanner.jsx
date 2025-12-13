import React, { useEffect, useState } from 'react'

const COOKIE_CONSENT_KEY = 'mutu-cookie-consent'

export default function CookieBanner({ align = 'bottom' }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
      if (!consent) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleConsent = value => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, value)
    } catch {
      // ignore quota errors
    }
    setVisible(false)
  }

  if (!visible) return null

  const positionClass = align === 'bottom' ? 'bottom-6' : 'top-6'

  return (
    <div className={`fixed inset-x-0 ${positionClass} z-40 flex justify-center px-4`}>
      <div className="max-w-3xl w-full rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/50 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/90 dark:shadow-slate-900/80">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-primary-600/80 dark:text-primary-300/70">Privasi & Cookies</p>
            <h4 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Kami menjaga kenyamanan data Anda</h4>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Kami memakai cookie untuk mengingat preferensi, menganalisis trafik anonim, dan meningkatkan pengalaman dashboard. Anda dapat menerima atau menolak kapan saja.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <button
              type="button"
              onClick={() => handleConsent('declined')}
              className="inline-flex items-center justify-center rounded-full border border-slate-200/80 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-800"
            >
              Tolak
            </button>
            <button
              type="button"
              onClick={() => handleConsent('accepted')}
              className="inline-flex items-center justify-center rounded-full bg-primary-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-primary-500/40 transition hover:bg-primary-700"
            >
              Terima Cookie
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
