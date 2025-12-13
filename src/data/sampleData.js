export const initialData = {
  akreditasi: {
    paripurna: 45,
    utama: 35,
    madya: 20
  },
  indikators: [
    { id: 1, name: 'Kepatuhan kebersihan tangan', capaian: 90.0, status: 'Mencapai Target', target: 95.0 },
    { id: 2, name: 'Kepatuhan penggunaan APD', capaian: 96.0, status: 'Tidak Mencapai Target', target: 98.0 },
    { id: 3, name: 'Kepatuhan identifikasi pasien', capaian: 99.0, status: 'Tidak Mencapai Target', target: 100.0 },
    { id: 4, name: 'Waktu tanggap operasi SC emergensi', capaian: 89.0, status: 'Mencapai Target', target: 90.0 }
  ],
  documents: [
    { id: 1, title: 'PERATURAN MUTU DAN AKREDITASI RS', fileUrl: '/documents/peraturan.pdf', icon: '+' },
    { id: 2, title: 'INSTRUMEN PEMBINAAN MUTU DAN AKREDITASI RS', fileUrl: '/documents/instrumen.pdf', icon: '+' },
    { id: 3, title: 'STANDAR AKREDITASI RUMAH SAKIT', fileUrl: '/documents/standar.pdf', icon: '+' }
  ]
}
