import React, { useEffect, useState } from 'react'
import { FaUniversalAccess, FaVolumeUp, FaStop } from 'react-icons/fa'

export default function AccessibilityWidget() {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSupported(true)
    }
  }, [])

  useEffect(() => {
    if (!supported) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const synth = window.speechSynthesis
    if (!synth) return

    const welcomeText =
      'Selamat datang di website Pelayanan Kesehatan Rujukan Dinas Kesehatan Provinsi Jawa Timur'
    const utterance = new SpeechSynthesisUtterance(welcomeText)
    utterance.lang = 'id-ID'
    utterance.rate = 1
    utterance.pitch = 1

    synth.cancel()
    synth.speak(utterance)
  }, [supported])

  function getMainText() {
    if (typeof document === 'undefined') return ''
    const main = document.querySelector('main')
    const text = main ? main.innerText : document.body.innerText
    return (text || '').trim().slice(0, 8000) // batasi biar tidak terlalu panjang
  }

  function stopSpeech() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  function handleToggleSpeak() {
    if (!supported) return

    if (speaking) {
      stopSpeech()
      return
    }

    const text = getMainText()
    if (!text) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'id-ID'
    utterance.rate = 1
    utterance.pitch = 1
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }

  if (!supported) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleToggleSpeak}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-slate-900/90 text-slate-50 text-xs md:text-sm shadow-lg border border-slate-700/80 hover:bg-slate-800 transition-colors"
        aria-label={speaking ? 'Hentikan pembacaan teks' : 'Aktifkan pembacaan teks'}
      >
        <FaUniversalAccess className="w-4 h-4" />
        {speaking ? (
          <>
            <FaStop className="w-3 h-3" />
            <span>Stop suara</span>
          </>
        ) : (
          <>
            <FaVolumeUp className="w-3 h-3" />
            <span>Baca halaman</span>
          </>
        )}
      </button>
    </div>
  )
}
