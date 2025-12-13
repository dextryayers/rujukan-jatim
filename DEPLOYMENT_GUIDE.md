# 🚀 Deployment Checklist - Web Mutu Pelayanan Jatim

## ✅ Backend Status (API)

**Status:** ✅ SUDAH SIAP (berdasarkan msg 14)

### Database Schema
- ✅ `users` table dengan columns: email, phone, role
- ✅ role ENUM('admin', 'member')
- ✅ Default role = 'member'

### API Endpoints
- ✅ `POST /api/auth.php?action=register` - Accept email, phone, role
- ✅ `POST /api/auth.php?action=login` - Return user object dengan role
- ✅ `GET /api/auth.php?action=me` - Return user profile
- ✅ `GET /api/auth.php?action=users` - Admin only, list all users
- ✅ `DELETE /api/auth.php?action=users?id=X` - Admin only, delete user
- ✅ `/api/akreditasi.php` - CRUD akreditasi
- ✅ `/api/indikators.php` - CRUD indikators
- ✅ `/api/documents.php` - Upload & manage documents
- ✅ `.htaccess` - Security & deny PHP in uploads folder
- ✅ `cleanup_tokens.php` - Token cleanup script
- ✅ `test-db.php` - Database test endpoint

---

## ✅ Frontend Status (React + Vite)

**Status:** ✅ BUILD SUKSES (Nov 21 10:52)

### Pages & Components
- ✅ `src/pages/Login.jsx` - Login form dengan role-based redirect
- ✅ `src/pages/Register.jsx` - Register dengan pilihan role (Admin/Member)
- ✅ `src/pages/AdminDashboard.jsx` - Admin dashboard dengan 4 tab (Chart, Indikator, Dokumen, User Mgmt)
- ✅ `src/pages/MemberDashboard.jsx` - Member dashboard dengan 5 tab (Ringkasan, Profil, Akreditasi, Indikator, Dokumen)
- ✅ `src/components/UserManagement.jsx` - User management table untuk admin
- ✅ `src/App.jsx` - Routing dengan role protection

### Context & Services
- ✅ `src/context/AppContext.jsx` - Global state dengan user role
- ✅ `src/services/api.js` - API service dengan auth methods

### Build Output
```
dist/
├── index.html (1.12 kB)
├── assets/
│   ├── index-*.css (21.92 kB)
│   ├── index.es-*.js (158.55 kB)
│   ├── jawa-*.ico (247.91 kB)
│   ├── purify.es-*.js (22.38 kB)
│   └── html2canvas.esm-*.js (201.40 kB)
└── documents/ (existing)
```

---

## 📋 Pre-Deployment Verification

### 1. Backend (cPanel)
```bash
# ✅ Verify test-db.php returns 200
curl https://dinkes.haniipp.my.id/api/test-db.php

# ✅ Verify auth endpoints work
curl -X POST https://dinkes.haniipp.my.id/api/auth.php?action=login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin1","password":"admin123"}'
```

### 2. Frontend Build
```bash
# ✅ Build memverifikasi tidak ada error
npm run build

# ✅ Output di /dist folder
ls -la dist/
```

### 3. Environment Variables
```
# .env atau vite.config.js harus punya:
VITE_API_URL=https://dinkes.haniipp.my.id/api/
```

---

## 🔄 Deployment Steps

### Step 1: Upload Frontend to cPanel
```bash
# Option A: Manual via FileManager
1. Open cPanel FileManager
2. Navigate to public_html/web-mutu/ (atau subfolder)
3. Upload dist/* files

# Option B: Via FTP
ftp://user@dinkes.haniipp.my.id
cd public_html/web-mutu/
put -r dist/*

# Option C: Via Git (jika git enabled)
git pull origin main
npm install
npm run build
# dist/ sudah ready
```

### Step 2: Update .htaccess (di root SPA)
File: `/public_html/web-mutu/.htaccess`
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /web-mutu/
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /web-mutu/index.html [L]
</IfModule>
```

### Step 3: Verify API Endpoints Working
```bash
# Test register
curl -X POST https://dinkes.haniipp.my.id/api/auth.php?action=register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123","email":"test@example.com","phone":"08123456789","role":"member"}'

# Response should be: {"ok":true}
```

### Step 4: Test Frontend URLs
```
https://dinkes.haniipp.my.id/web-mutu/        → Homepage
https://dinkes.haniipp.my.id/web-mutu/login   → Login page
https://dinkes.haniipp.my.id/web-mutu/register → Register page
```

---

## 🎯 Testing Flow (After Deployment)

### Flow 1: Member Registration & Login
```
1. Go to /register
2. Select "👤 Member" role
3. Fill form: email, phone, username, password
4. Click "Daftar"
5. Auto redirect to /member
6. See Member Dashboard (read-only)
7. Logout
```

### Flow 2: Admin Registration & Login
```
1. Go to /register
2. Select "⚙️ Admin" role
3. Fill form: email, phone, username, password
4. Click "Daftar"
5. Auto redirect to /admin
6. See Admin Dashboard (with edit + user management)
7. Click "👥 User Management" tab
8. See list of users
9. Try delete member
```

### Flow 3: Login After Registration
```
1. Go to /login
2. Enter member username & password
3. Click "Login"
4. Auto redirect to /member
OR
1. Enter admin username & password
2. Click "Login"
3. Auto redirect to /admin
```

---

## 🔐 Security Checklist

- ✅ Bearer token stored in Authorization header
- ✅ Token stored in localStorage (remember, not fully secure but OK for MVP)
- ✅ Password hashed dengan PASSWORD_BCRYPT
- ✅ CORS configured safely (whitelist origin)
- ✅ File upload validated (mime type, size)
- ✅ .htaccess deny PHP in uploads folder
- ✅ Role-based access control on backend (require_admin)
- ✅ Role-based routing on frontend

---

## 📊 Browser Testing

- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari (iOS)
- [ ] Mobile Chrome
- [ ] Dark mode toggle
- [ ] Network throttling (slow 3G)

---

## 📞 Troubleshooting

### Issue: Blank white page after deployment
**Solution:**
1. Check browser console for errors (F12)
2. Verify VITE_API_URL matches backend
3. Check dist/index.html exists
4. Verify .htaccess RewriteRule correct

### Issue: API returns 404
**Solution:**
1. Verify /api/ folder exists in cPanel
2. Check api/auth.php, akreditasi.php, etc.
3. Test curl to /api/test-db.php
4. Check file permissions (644 for .php)

### Issue: Login always fails
**Solution:**
1. Test database connection: curl /api/test-db.php
2. Check bearer_token function in api/utils.php
3. Verify users table has correct schema
4. Check password hash in database

### Issue: Role redirect not working
**Solution:**
1. Check user object returned from login has role field
2. Verify AppContext sets user correctly
3. Check Login.jsx useEffect triggers
4. Open DevTools, inspect user state

---

## 📝 Files Ready for Deployment

### Frontend (Ready in dist/)
- index.html
- assets/index-*.css
- assets/index.es-*.js
- assets/html2canvas.esm-*.js
- assets/purify.es-*.js
- assets/jawa-*.ico

### Backend (Already on cPanel)
- api/auth.php ✅
- api/akreditasi.php ✅
- api/indikators.php ✅
- api/documents.php ✅
- api/utils.php ✅
- api/config.php ✅
- api/.htaccess ✅
- api/cleanup_tokens.php ✅
- api/test-db.php ✅

---

## ✨ Final Checklist Before Going Live

- [ ] npm run build sukses
- [ ] dist/ folder exist with all files
- [ ] Backend API test-db.php returns 200
- [ ] Upload dist/ to cPanel
- [ ] Update .htaccess for SPA routing
- [ ] Test /register page load
- [ ] Test member registration flow
- [ ] Test admin registration flow
- [ ] Test member login → /member redirect
- [ ] Test admin login → /admin redirect
- [ ] Test member dashboard (read-only)
- [ ] Test admin dashboard (edit + user mgmt)
- [ ] Test user delete from admin panel
- [ ] Test logout functionality
- [ ] Test dark mode
- [ ] Test mobile responsive
- [ ] Check browser console has NO errors
- [ ] Check Network tab has NO failed requests

---

## 🎉 READY TO DEPLOY!

Semua komponen sudah siap. Tinggal upload dist/ ke cPanel!
