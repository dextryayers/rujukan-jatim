import React from 'react'
import dokterImg from '../../images/dokter.webp'

export default function HeroSection() {
  return (
    <section className="hero-bg py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="bg-white/95 dark:bg-slate-900/95 rounded-3xl p-6 md:p-10 border border-slate-100/80 dark:border-slate-800/70 backdrop-blur-sm section-glow shadow-lg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-10">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-primary-900 dark:text-primary-100 leading-tight">
                PELAYANAN KESEHATAN RUJUKAN
              </h1>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 mt-2">DINAS KESEHATAN PROVINSI JAWA TIMUR</p>
              <p className="mt-5 text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">
                SELAYANG PANDANG
              </p>
              <p className="mt-2 text-sm md:text-base text-slate-700 dark:text-slate-200 max-w-xl mx-auto md:mx-0">
                Dashboard Ringkasan Gambaran Pelayanan Kesehatan Rujukan
              </p>
              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
                <a
                  href="#akreditasi"
                  className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-sm hover:shadow-md transition-transform duration-150 hover:-translate-y-0.5"
                >
                  Lihat Akreditasi
                </a>
                <a
                  href="#indikator"
                  className="inline-flex items-center border border-primary-600/70 text-primary-700 dark:text-primary-200 px-5 py-2.5 rounded-full text-sm font-semibold bg-white/70 dark:bg-slate-900/70 hover:bg-primary-50/70 dark:hover:bg-primary-900/30 transition-colors shadow-sm hover:shadow-md"
                >
                  Lihat Indikator
                </a>
              </div>
            </div>
            <div className="mt-6 md:mt-0 w-full flex justify-center md:block md:w-64 lg:w-72">
              <div className="w-48 xs:w-52 sm:w-60 md:w-full bg-primary-50/80 dark:bg-slate-900/80 border border-primary-100/80 dark:border-slate-700 rounded-2xl p-3 md:p-4 text-center shadow-md section-glow">
                <img alt="hospital" src={dokterImg} className="w-full object-cover rounded-xl animate-float" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
