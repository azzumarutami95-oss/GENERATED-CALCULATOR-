# SECTION / Studio Beton

Aplikasi satu file HTML, berbahasa Indonesia, tanpa dependensi dan tanpa koneksi internet.

## Membuka

Unduh `index.html`, lalu buka dengan browser modern (Chrome, Edge, Firefox, atau Safari). Tidak memerlukan npm, server, atau proses build. Tombol **Simpan JSON** mengarsipkan input; **Buka data** memuat kembali; **Cetak / PDF** menampilkan semua panel perhitungan.

## Fitur

- Rectangle dan round, solid maupun hollow konsentris.
- Properti luas dan inersia; gambar SVG penampang dan proyeksi memanjang dengan tulangan perimeter, sengkang tertutup, dan kelompok tendon bonded.
- Material beton, baja longitudinal, sengkang, serta tendon.
- Fx, Fy, Fz (kN), Mx, My, Mz (kN·m), pada sumbu lokal MIDAS Civil. Muka +x: +y ke kanan, +z ke atas; momen mengikuti tangan kanan. Verifikasi orientasi elemen dan tanda keluaran ujung i/j sebelum memasukkan data.
- Keseimbangan aksial dan kapasitas lentur per arah dengan integrasi blok Whitney; model geser dan torsi dengan parameter β, θ dan φ eksplisit.
- Validasi dimensi, jarak batang, lokasi pusat tendon, dan input numerik. Tampilan responsif.

## Batas penerapan

Acuan: **AASHTO LRFD Bridge Design Specifications, 9th Edition (2020), Section 5**. Aplikasi ini merupakan alat eksplorasi dan pemeriksaan awal, bukan implementasi lengkap atau sertifikasi kepatuhan AASHTO. Lihat panel **Asumsi & referensi** untuk rumus, cakupan, dan pengecualian.

β dan θ adalah input pengguna, bukan hasil MCFT. φ lentur belum ditentukan otomatis dari regangan. Interaksi dua arah berupa penyaring linear. Tendon memakai idealisasi bonded dengan tegangan awal efektif; tendon unbonded, transfer dan serviceability belum dihitung. Hollow memakai satu perimeter sengkang luar dan pendekatan dua dinding untuk geser; tidak memverifikasi tulangan dalam atau distorsi. Tulangan longitudinal torsi belum dialokasikan bersama kebutuhan lentur. Hasil harus diverifikasi engineer sebelum digunakan untuk desain.

## Pengembangan

Edit `index.html` langsung. CSS, JavaScript, dan SVG disertakan dalam berkas tersebut. Tidak ada permintaan jaringan, pustaka eksternal, atau penyimpanan otomatis. Tidak perlu membuat Git worktree untuk menjalankan aplikasi.
