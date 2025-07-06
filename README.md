# 🌟 Alvianz Store - Premium Digital Services Platform

Selamat datang di Alvianz Store, platform e-commerce digital premium dengan sistem coin yang canggih dan admin panel berbasis galaxy theme.

## 📁 Struktur Proyek

```
alvianz-platform/
├── toko-alvianz/          # Website Toko Online
│   ├── index.html         # Halaman utama toko
│   ├── styles.css         # Styling toko
│   ├── script.js          # Fungsi toko
│   └── firebase-config.js # Konfigurasi Firebase
├── admin-panel/           # Admin Panel Galaxy
│   ├── index.html         # Halaman admin
│   ├── admin-styles.css   # Styling admin galaxy
│   ├── admin-script.js    # Fungsi admin
│   └── firebase-config.js # Konfigurasi Firebase
└── README.md             # Dokumentasi
```

## 🚀 Fitur Utama

### 🛒 Toko Online (Premium Theme)
- **Login/Register System** dengan validasi
- **Sistem Coin** (1 coin = Rp 1.000)
- **Bonus Login** 7 hari berturut = 30 coin gratis
- **4 Produk Template** premium:
  - NEXUS (2.400 coins)
  - MPO (4.300 coins) 
  - ID (2.700 coins)
  - UG (3.500 coins)
- **Deposit System** via QRIS & Dana
- **WhatsApp Integration** otomatis
- **Profile Management** dengan upload foto
- **Riwayat Pembelian & Deposit**
- **Responsive Design** dengan particle effects
- **Auto Save Session** data akun

### 🌌 Admin Panel (Galaxy Theme)
- **Galaxy Command Center** dengan tema luar angkasa
- **Dashboard Analytics** real-time
- **User Management** lengkap
- **Deposit Approval** system
- **Sales Monitoring** 
- **Inject Coins** ke user
- **Product Analytics** 
- **Revenue Statistics**
- **Real-time Updates** otomatis
- **99,999,999 Admin Coins**

## 🔑 Kredensial Login

### Admin Panel
- **Email:** Dewan@alvianz.id
- **Password:** vianz666

### Toko Online
User dapat membuat akun baru atau menggunakan akun yang sudah terdaftar.

## 📞 Kontak Info
- **WhatsApp Admin:** 6283142313394
- **Dana:** 083142313394
- **Owner:** AlvianzLX

## 🎨 Teknologi yang Digunakan

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Database:** Firebase Realtime Database
- **Authentication:** Firebase Auth
- **Design:** Modern Gradient & Galaxy Theme
- **Font:** Orbitron (Sci-fi) + Inter (Modern)
- **Icons:** Font Awesome 6
- **Effects:** Particle.js, CSS Animations

## ⚡ Cara Menjalankan

### 1. Setup Firebase
```javascript
// Sudah dikonfigurasi dengan:
apiKey: "AIzaSyCn7CiwINqT5JQZHJlKjTOLRMFu99HE9Sw"
authDomain: "alvianz-panel.firebaseapp.com"
databaseURL: "https://alvianz-panel-default-rtdb.firebaseio.com"
projectId: "alvianz-panel"
```

### 2. Hosting Toko Online
1. Upload folder `toko-alvianz/` ke hosting
2. Akses melalui domain toko
3. User dapat langsung register/login

### 3. Hosting Admin Panel  
1. Upload folder `admin-panel/` ke hosting terpisah
2. Akses melalui domain admin
3. Login dengan kredensial admin

### 4. Hosting via GitHub & Netlify
```bash
# Push ke GitHub repository
git add .
git commit -m "Alvianz Platform"
git push origin main

# Deploy ke Netlify:
# 1. Connect GitHub repo
# 2. Set build folder: toko-alvianz (untuk toko)
# 3. Set build folder: admin-panel (untuk admin)
```

## 🔧 Fitur Sistem

### Sistem Coin
- 1 Coin = Rp 1.000
- Minimum deposit: Rp 10.000 (10 coins)
- Auto conversion saat deposit
- Bonus login harian
- Inject coins oleh admin

### WhatsApp Integration
**Format Pesan Otomatis:**
```
Halo Admin Alvianz, saya sudah melakukan pembelian produk *[NAMA_PRODUK]*.

Berikut data saya:
- Nama Rekening: [INPUT]
- Nomor Rekening: [INPUT] 
- Request Domain: [INPUT]
- Nama Situs: [INPUT]
- Username Admin Panel: [INPUT]
- Password Admin Panel: [INPUT]

Mohon diproses segera. Terima kasih!
```

### Sistem Bonus
- Login 7 hari berturut = 30 coins
- Reset streak jika terlewat 1 hari
- Tracking login streak otomatis

## 🎯 Flow Pembelian

1. **User Login** → Dashboard
2. **Pilih Produk** → Loading Animation
3. **Isi Form** → Data pelanggan
4. **Auto WhatsApp** → Pesan terkirim
5. **Coins Terpotong** → Saldo berkurang
6. **Admin Approval** → Selesaikan pesanan

## 🛡️ Flow Deposit

1. **User Request** → Pilih QRIS/Dana
2. **Input Amount** → Auto convert coins
3. **WhatsApp Admin** → Konfirmasi transfer  
4. **Admin Approve** → Coins masuk akun
5. **Real-time Update** → Saldo bertambah

## 📊 Admin Features

### Dashboard
- Total Users
- Total Coins Distributed  
- Total Sales
- Total Revenue
- Recent Activity

### User Management
- View all users
- Check coins balance
- Login streak tracking
- Inject coins function

### Deposit Control
- Pending deposits
- Approve/Reject system
- Auto coin distribution
- Transaction logging

### Sales Monitor
- All purchases
- Product popularity
- Complete orders
- Revenue tracking

### Analytics
- Product statistics
- User growth charts
- Revenue analysis
- Profit margins

## 🎨 Design Features

### Toko Online
- Modern gradient theme
- Particle background effects
- Smooth animations
- Glass morphism cards
- Responsive mobile design
- Loading animations
- Floating elements

### Admin Panel
- Galaxy space theme
- Animated stars background
- Planet & orbit loader
- Neon glow effects
- Sci-fi typography
- Holographic buttons
- Space-themed notifications

## 💾 Data Structure

### Users Collection
```javascript
{
  username: "string",
  password: "string", 
  fullName: "string",
  coins: number,
  profileImage: "url",
  loginStreak: number,
  totalLogins: number,
  lastLogin: "timestamp",
  purchaseHistory: [],
  depositHistory: []
}
```

### Deposits Collection
```javascript
{
  id: timestamp,
  username: "string",
  userFullName: "string", 
  amount: number,
  coins: number,
  date: "timestamp",
  status: "pending|approved|rejected"
}
```

### Purchases Collection
```javascript
{
  id: timestamp,
  username: "string",
  userFullName: "string",
  productName: "string",
  price: number,
  formData: {},
  date: "timestamp", 
  status: "pending|completed"
}
```

## 🔄 Auto Features

- **Real-time Sync** antara toko dan admin
- **Auto Refresh** data setiap 30 detik
- **Session Management** otomatis
- **Responsive Updates** cross-platform
- **Auto Backup** ke Firebase
- **Error Handling** comprehensive

## 🎁 Bonus Features

- **Keyboard Shortcuts** untuk admin (Ctrl+R refresh)
- **Click Outside** close modals
- **Loading States** semua actions
- **Toast Notifications** real-time feedback
- **Profile Image Upload** dengan preview
- **Search & Filter** capabilities
- **Export Data** functionality
- **Dark Mode** optimized

## 📱 Mobile Responsive

- **Adaptive Layout** semua screen sizes
- **Touch Optimized** buttons & interactions  
- **Mobile Menu** collapsed navigation
- **Swipe Gestures** untuk modal
- **Performance Optimized** mobile loading

## 🚀 Deployment Ready

Website ini sudah siap deploy dengan:
- ✅ **Firebase Integration** configured
- ✅ **CDN Assets** external links
- ✅ **Production Ready** code
- ✅ **Error Handling** comprehensive
- ✅ **Performance Optimized** 
- ✅ **SEO Friendly** structure
- ✅ **Security Best Practices**

## 📞 Support

Untuk bantuan teknis atau customization:
- **WhatsApp:** 6283142313394
- **Email:** Dewan@alvianz.id
- **Owner:** AlvianzLX

---

**© 2024 Alvianz Store - Premium Digital Services Platform**
**Powered by AlvianzLX Technology**

*"Membangun masa depan digital dengan teknologi terdepan"* 🌟