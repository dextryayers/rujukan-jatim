import React from 'react'
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaInstagram, FaFacebookF, FaTiktok, FaYoutube } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#0b3a88] to-[#05173b] text-slate-50 dark:from-[#071f4f] dark:to-[#020b23] border-t border-[#062654]/80 dark:border-[#020b23]/80">
      <div className="container mx-auto px-4 py-10 space-y-10">
        <div className="flex flex-col items-start gap-3">
          <p className="text-[11px] uppercase tracking-[0.25em] text-sky-200/80">Pelayanan Kesehatan Rujukan</p>
          <h4 className="text-xl md:text-2xl font-semibold tracking-tight text-slate-50">
            Dinas Kesehatan Provinsi Jawa Timur
          </h4>
          <p className="text-xs md:text-sm text-slate-100/80 max-w-2xl">
            Portal informasi mutu pelayanan kesehatan rujukan, akreditasi rumah sakit, dan indikator nasional mutu rumah sakit di Jawa Timur.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
          <div>
            <h5 className="font-semibold text-slate-50 tracking-wide flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center rounded-full bg-primary-500/95 text-[11px] px-2 py-0.5 uppercase tracking-widest">Kontak</span>
            </h5>
            <div className="space-y-2 text-xs md:text-sm text-slate-100/90">
              <div className="flex items-start gap-2">
                <FaMapMarkerAlt className="mt-0.5 w-4 h-4" />
                <span>Jl. A. Yani No. 118, Ketintang, Gayungan, Surabaya, Jawa Timur</span>
              </div>
              <div className="flex items-center gap-2">
                <FaPhoneAlt className="w-4 h-4" />
                <span>Telepon (031) 8280910 / Fax (031) 8290423</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="w-4 h-4" />
                <a href="mailto:dinkes@jatimprov.go.id" className="hover:text-sky-200 dark:hover:text-sky-300 transition-colors">dinkes@jatimprov.go.id</a>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-slate-50 tracking-wide flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center rounded-full bg-sky-500/95 text-[11px] px-2 py-0.5 uppercase tracking-widest">Navigasi</span>
              <span className="hidden sm:inline text-[11px] text-slate-100/80">Halaman Utama</span>
            </h5>
            <ul className="mt-2 space-y-1.5 text-slate-100">
              <li><a href="#akreditasi" className="hover:text-sky-200 transition-colors">Akreditasi</a></li>
              <li><a href="#indikator" className="hover:text-sky-200 transition-colors">Indikator</a></li>
              <li><a href="#dokumen" className="hover:text-sky-200 transition-colors">Dokumen</a></li>
            </ul>
            <div className="mt-4 space-y-1.5 text-xs md:text-sm">
              <p className="font-semibold text-slate-50">Login Aplikasi Kemkes</p>
              <a href="https://mutufasyankes.kemkes.go.id/" target="_blank" rel="noopener noreferrer" className="block hover:text-sky-200 transition-colors">Mutu Fasyankes</a>
              <a href="https://mutufasyankes.kemkes.go.id/simar" target="_blank" rel="noopener noreferrer" className="block hover:text-sky-200 transition-colors">SIMAR</a>
              <a href="https://mutufasyankes.kemkes.go.id/ppra" target="_blank" rel="noopener noreferrer" className="block hover:text-sky-200 transition-colors">PPRA</a>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-slate-50 tracking-wide flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center rounded-full bg-emerald-500/95 text-[11px] px-2 py-0.5 uppercase tracking-widest">Grup WA</span>
              <span className="hidden sm:inline text-[11px] text-slate-100/80">Komite RS Jatim</span>
            </h5>
            <p className="mt-1 mb-3 text-slate-100 text-xs">Pilih grup sesuai peran untuk koordinasi dan update informasi.</p>
            <div className="space-y-2 text-xs md:text-sm">
              <a
                href="https://chat.whatsapp.com/E45dOu9ihNSFTJbE2EHjmK"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-500 shadow-sm hover:shadow-md transition w-full justify-center sm:justify-start"
              >
                <span>🟢</span>
                <span className="font-semibold">Yanmed RS Jatim</span>
              </a>
              <a
                href="https://chat.whatsapp.com/FStqzv0F3O8ENbfwHK8jlI"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-500 shadow-sm hover:shadow-md transition w-full justify-center sm:justify-start"
              >
                <span>🟢</span>
                <span className="font-semibold">Komite Mutu RS se-Jatim</span>
              </a>
              <a
                href="https://chat.whatsapp.com/KoeOGtoiTAj5IvCcusW9h7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-500 shadow-sm hover:shadow-md transition w-full justify-center sm:justify-start"
              >
                <span>🟢</span>
                <span className="font-semibold">SIRS RS Jatim</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-slate-50 tracking-wide flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center rounded-full bg-indigo-500/95 text-[11px] px-2 py-0.5 uppercase tracking-widest">Dokumen</span>
              <span className="hidden sm:inline text-[11px] text-slate-100/80">& Media</span>
            </h5>
            <div className="mt-1 space-y-2 text-xs md:text-sm">
              <a
                href="https://drive.google.com/drive/folders/1NMeckaJHmKTGxJwosEBF1yJp-IkR_EJr"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-sky-200 transition-colors"
              >
                📂 Akreditasi RS (Drive)
              </a>
              <a
                href="https://drive.google.com/drive/folders/1RkQyCfYR39JWahLNp0Hu29Xfyld2LxqE"
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:text-sky-200 transition-colors"
              >
                📂 Indikator Nasional (Drive)
              </a>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-100 mb-2">Ikuti kami di media sosial:</p>
              <div className="flex items-center flex-wrap gap-4 mt-1 text-xl">
                <a
                  href="https://instagram.com/@dinkesjatim"
                  className="text-white hover:text-[#E4405F] transition-colors"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-[#1877F2] transition-colors"
                  aria-label="Facebook"
                >
                  <FaFacebookF />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-[#69C9D0] transition-colors"
                  aria-label="TikTok"
                >
                  <FaTiktok />
                </a>
                <a
                  href="#"
                  className="text-white hover:text-[#FF0000] transition-colors"
                  aria-label="YouTube"
                >
                  <FaYoutube />
                </a>
                <a
                  href="https://haniipp.space"
                  className="text-xs font-semibold tracking-wide text-white hover:text-sky-200 transition-colors"
                  aria-label="Credit Dev"
                >
                  DEV
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#041634]/95 dark:bg-[#020b23] text-center text-xs md:text-sm py-3 border-t border-[#041632]/80 dark:border-[#00010a]/80 text-slate-100">
        <span className="block md:inline">© 2025 Dinas Kesehatan Provinsi Jawa Timur.</span>
        <span className="block md:inline md:ml-1">Build WIth ❤️</span>
      </div>
    </footer>
  )
}
