import React from 'react'
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3'

export default function RecaptchaProvider({ children }) {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY
  if (!siteKey) return children

  return (
    <GoogleReCaptchaProvider reCaptchaKey={siteKey} scriptProps={{ async: true, defer: true }}>
      {children}
    </GoogleReCaptchaProvider>
  )
}
