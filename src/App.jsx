import React, { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar'
import HeroSection from './components/HeroSection'
import AkreditasiSection from './components/AkreditasiSection'
import IndikatorTable from './components/IndikatorTable'
import DownloadSection from './components/DownloadSection'
import Footer from './components/Footer'
import VisitorWidget from './components/VisitorWidget'
import CookieBanner from './components/CookieBanner'
import jawaLogo from '../images/jawa.png'
import AdminDashboard from './pages/AdminDashboard'
import MemberDashboard from './pages/MemberDashboard'
import { useApp } from './context/AppContext'
import Login from './pages/Login'
import Register from './pages/Register'
import TestPing from './components/TestPing';


function FullScreenLoader({ message = 'Memuat konten' }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-slate-950 text-slate-100">
      <div className="w-16 h-16 border-4 border-primary-500/30 border-t-primary-400 rounded-full animate-spin mb-4" />
      <p className="text-sm md:text-base text-slate-200">{message}</p>
    </div>
  )
}


export default function App() {
  const { user } = useApp()
  const location = useLocation()
  const [initialLoading, setInitialLoading] = useState(true)

  function ScrollToHash(){
    const location = useLocation()
    useEffect(() => {
      if (location.hash) {
        const id = location.hash.replace('#','')
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }
    }, [location])
    return null
  }

  useEffect(() => {
    const t = setTimeout(() => setInitialLoading(false), 1200)
    return () => clearTimeout(t)
  }, [])

  // // Lock body scroll on auth pages (login & register)
  // useEffect(() => {
  //   const body = document.body
  //   const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  //   if (isAuthPage) {
  //     body.classList.add('overflow-hidden')
  //   } else {
  //     body.classList.remove('overflow-hidden')
  //   }
  //   return () => {
  //     body.classList.remove('overflow-hidden')
  //   }
  // }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col relative">
      {initialLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100">
          <img
            src={jawaLogo}
            alt="Logo Provinsi Jawa Timur"
            className="w-20 h-20 mb-5 drop-shadow-lg"
          />
          <div className="w-16 h-16 border-4 border-primary-500/40 border-t-primary-400 rounded-full animate-spin mb-4" />
          <p className="initial-loading-text text-center text-sm md:text-base text-slate-200">
            Selamat datang di website rujukan kesehatan Pemprov. Jatim
          </p>
        </div>
      )}
      <Navbar />
      <main className="flex-1">
        <ScrollToHash />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <HeroSection />
                <section id="akreditasi">
                  <AkreditasiSection />
                </section>
                <section id="indikator" className="py-12">
                  <div className="container mx-auto px-4">
                    <IndikatorTable />
                  </div>
                </section>
                <section id="dokumen" className="py-12">
                  <div className="container mx-auto px-4">
                    <DownloadSection />
                  </div>
                </section>
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/admin" 
            element={
              user && user.role === 'admin' 
                ? <AdminDashboard /> 
                : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/member" 
            element={
              user && user.role === 'member' 
                ? <MemberDashboard /> 
                : <Navigate to="/login" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <VisitorWidget />
      {location.pathname !== '/admin' && location.pathname !== '/member' && location.pathname !== '/login' && location.pathname !== '/register' && <Footer />}
      <CookieBanner align={location.pathname === '/admin' ? 'top' : 'bottom'} />
      <TestPing />
    </div>
  )
}
