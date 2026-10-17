# Kapsul Cinta

Web gacha hadiah romantis berbasis React, TypeScript, dan Vite. Setiap klik membuka satu kartu; empat kartu pertama memakai desain terpisah di `public/okta-gacha-card-1.png` sampai `public/okta-gacha-card-4.png`, lalu klik kelima memunculkan kartu ulang tahun Okta dari `public/okta-special-card.png` dengan animasi langka.

Audio latar yang lembut dan efek klik/buka pack dibuat secara sintetis di browser, dengan video referensi sebagai panduan suasana dan timing. Tidak ada file audio tambahan yang diperlukan. Ikon musik di kanan atas dapat digunakan untuk menyalakan atau mematikan audio. Browser biasanya memblokir autoplay, jadi suara mulai saat pengguna mengklik tombol musik atau tombol gacha pertama kali.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Untuk memeriksa aplikasi dan membuat build produksi:

```bash
npm run lint
npm run build
```

## Personalisasi

Nama panggilan dan kalimat untuk kartu/pesan ada di bagian awal `src/App.tsx`:

```ts
const partnerName = 'Okta'
const cardMessage = 'Selalu jadi cahaya paling hangat di setiap petualangan.'
```

Empat gambar kartu gabungan sudah dipisahkan menjadi `public/okta-gacha-card-1.png` sampai `public/okta-gacha-card-4.png` dan ditampilkan sebagai gambar kartu utuh; ikon di bawah kartu bisa diklik untuk melihat ulang kartu terkait. Ganti file yang sesuai jika ingin mengubah desain kartu. Kartu kelima menggunakan gambar asli di `public/okta-special-card.png`. Untuk menyesuaikan isi surat, ubah teks di bagian `love-letter` pada file `src/App.tsx`.

Mesin gacha lebih dulu memuat dan mendekode kesembilan varian bola sebelum mengaktifkan tombol buka dan menampilkan tumpukannya. Jika pemuatan gagal, pengguna dapat mencoba lagi. Bola yang melompat keluar dipilih acak tanpa pengulangan pada empat tarikan pertama; tarikan kelima menampilkan Love Ball dengan efek khusus dari `public/love-ball.png` lalu kembang api bernuansa ulang tahun ketika kartu langka muncul. Animasi diatur di `src/App.css`.
