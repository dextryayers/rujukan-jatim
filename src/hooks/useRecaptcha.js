import { useCallback } from 'react'
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'

export default function useRecaptcha(action = 'general') {
  const { executeRecaptcha } = useGoogleReCaptcha()
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

  return useCallback(async () => {
    if (!siteKey || !executeRecaptcha) {
      // fallback for local/dev when reCAPTCHA not configured
      return 'dev-recaptcha-bypass'
    }
    try {
      const token = await executeRecaptcha(action)
      return token || null
    } catch (err) {
      console.warn('Failed to execute reCAPTCHA', err)
      return null
    }
  }, [action, executeRecaptcha, siteKey])
}
