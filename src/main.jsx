import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { AppProvider } from './context/AppContext'
import RecaptchaProvider from './components/RecaptchaProvider'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RecaptchaProvider>
      <AppProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AppProvider>
    </RecaptchaProvider>
  </React.StrictMode>
)
