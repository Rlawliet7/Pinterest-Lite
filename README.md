# Pinterest Lite

Mini project penerapan **image database** dengan konsep **Pinterest Lite**: daftar gambar multi-user, upload multi-provider, masonry gallery, dan fitur download.

> **Live Demo:** https://pinterest-lite-rust.vercel.app/

## ✨ Overview

Pinterest Lite adalah aplikasi full-stack sederhana untuk mengelola dan menampilkan koleksi gambar dari banyak user. Project ini dibuat untuk menerapkan konsep:

- User authentication menggunakan JWT
- Access token dan refresh token dengan rotation
- Multi-user image management
- Upload gambar menggunakan beberapa storage provider
- Penyimpanan metadata gambar di MongoDB
- Pinterest-style masonry gallery
- Preview gambar menggunakan lightbox
- Download gambar melalui backend
- Delete gambar dengan validasi ownership
- Deployment serverless menggunakan Vercel

## 🚀 Features

### Authentication

- Register user
- Login user
- Logout
- Get current user (`/me`)
- JWT access token
- JWT refresh token
- Refresh token disimpan dalam bentuk hash di MongoDB
- Refresh token rotation dan revoke/reuse detection
- Password di-hash menggunakan bcrypt

### Image Management

- Upload JPEG, PNG, dan WEBP
- Maximum file size: **5 MB**
- Upload menggunakan `multipart/form-data`
- Metadata gambar disimpan di MongoDB
- Setiap gambar memiliki pemilik (`userId`)
- List gambar milik user
- Public multi-user feed
- Download gambar
- Delete gambar hanya oleh pemiliknya

### Multi-Provider Storage

Upload provider yang tersedia:

- **Cloudinary**
- **ImageKit**
- **Supabase Storage**

Provider dipilih ketika melakukan upload dan implementasinya dipisahkan melalui service masing-masing.

## 🏗️ Architecture

```text
Client (HTML/CSS/JavaScript)
        │
        │ HTTP / REST API
        ▼
┌───────────────────────┐
│     Express.js API    │
├───────────────────────┤
│ Routes                │
│ Controllers           │
│ Middlewares           │
│ Services              │
└───────────┬───────────┘
            │
     ┌──────┴───────┐
     ▼              ▼
 MongoDB       Image Storage
 (metadata)    ┌───────────────┐
               │ Cloudinary    │
               │ ImageKit      │
               │ Supabase      │
               └───────────────┘
```

MongoDB tidak menyimpan file gambar secara langsung. MongoDB menyimpan metadata seperti `url`, `publicId`, `provider`, `mimeType`, `size`, dan pemilik gambar. File fisiknya berada pada storage provider yang dipilih.

## 📁 Project Structure

```text
Pinterest-Lite/
├── api/
│   └── index.js                 # Vercel serverless entry point
│
├── frontend/
│   ├── css/
│   │   └── style.css            # UI styling
│   ├── js/
│   │   ├── api.js               # API client + token refresh handling
│   │   ├── auth.js              # Login/register logic
│   │   ├── dashboard.js         # Feed, download, delete, lightbox
│   │   ├── upload.js            # Image upload logic
│   │   ├── toast.js             # Toast notification
│   │   └── speed-insights.js
│   ├── index.html               # Landing page
│   ├── login.html               # Login page
│   ├── register.html            # Register page
│   └── dashboard.html           # Main gallery
│
├── src/
│   ├── config/
│   │   ├── db.js                # MongoDB connection + caching
│   │   └── env.js               # Environment configuration
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── upload.controller.js
│   │   └── user.controller.js
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   ├── error.middleware.js
│   │   └── upload.middleware.js
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Image.js
│   │   └── RefreshToken.js
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── upload.routes.js
│   │   └── user.routes.js
│   │
│   ├── services/
│   │   ├── token.service.js
│   │   ├── upload.service.js
│   │   ├── cloudinary.service.js
│   │   ├── imagekit.service.js
│   │   └── supabase.service.js
│   │
│   └── utils/
│       ├── AppError.js
│       └── asyncHandler.js
│
├── server.js                    # Local Node.js entry point
├── vercel.json                  # Vercel routing/build configuration
├── package.json
└── README.md
```

## 🔐 Authentication Flow

```text
Register / Login
      │
      ├── Access Token
      │      └── digunakan pada Authorization: Bearer <token>
      │
      └── Refresh Token
             └── disimpan sebagai hash di MongoDB

Access Token expired
      │
      ▼
POST /api/auth/refresh
      │
      ├── verify refresh JWT
      ├── check token hash
      ├── revoke old refresh token
      ├── generate new access token
      └── generate + store new refresh token
```

Access token memiliki TTL default **15 menit**, sedangkan refresh token default **7 hari**. Nilainya dapat diubah melalui environment variable.

Pada implementasi frontend saat ini, access token dan refresh token disimpan di `localStorage`. Client API akan mencoba refresh ketika menerima response `401`, kemudian mengulangi request menggunakan access token baru.

> Untuk production dengan kebutuhan keamanan yang lebih tinggi, refresh token sebaiknya dipindahkan ke **HttpOnly Secure Cookie** agar tidak dapat diakses langsung oleh JavaScript.

## 🖼️ Image Upload Flow

```text
User selects image
        │
        ▼
Multer memoryStorage
        │
        ├── MIME validation
        │      JPEG / PNG / WEBP
        │
        └── Max 5 MB
        │
        ▼
POST /api/upload
        │
        ▼
Select provider
 ┌──────┼──────────┐
 ▼      ▼          ▼
Cloudinary ImageKit Supabase
 └──────┼──────────┘
        ▼
Receive URL + publicId
        │
        ▼
Save metadata to MongoDB
        │
        ▼
Return image document
```

Jika storage berhasil tetapi penyimpanan metadata MongoDB gagal, backend mencoba melakukan **rollback delete** pada file yang sudah di-upload ke provider.

## 📡 API Endpoints

Base URL lokal:

```text
http://localhost:5000/api
```

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register user |
| POST | `/auth/login` | No | Login user |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | No | Revoke refresh token |
| GET | `/auth/me` | Yes | Get authenticated user |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Yes | Get current user |
| PUT | `/users/me` | Yes | Update name/avatar |

### Images

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/upload` | Yes | Upload image |
| GET | `/upload` | Yes | List current user's images |
| GET | `/upload/feed` | Yes | Get multi-user image feed |
| GET | `/upload/:id/download` | Yes | Download image |
| DELETE | `/upload/:id` | Yes | Delete owned image |

### Upload Request

Endpoint:

```http
POST /api/upload
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

Form fields:

```text
image     = <image file>
provider  = cloudinary | imagekit | supabase
```

## 🗃️ Database Models

### User

```text
User
├── email
├── passwordHash
├── name
├── avatarUrl
├── createdAt
└── updatedAt
```

Password hash tidak dikembalikan ketika document user diubah menjadi JSON.

### Image

```text
Image
├── userId       → User
├── originalName
├── provider
├── url
├── publicId
├── mimeType
├── size
└── createdAt
```

Terdapat index pada `userId` dan compound index:

```text
{ userId: 1, createdAt: -1 }
```

Index tersebut membantu query gambar berdasarkan user sekaligus mengurutkannya dari yang terbaru.

### RefreshToken

```text
RefreshToken
├── userId
├── tokenHash
├── expiresAt
├── revoked
├── createdAt
└── updatedAt
```

`expiresAt` menggunakan MongoDB TTL index sehingga record refresh token dapat dihapus otomatis setelah expired.

## 🧩 Error Handling

Backend menggunakan centralized error middleware untuk menangani beberapa kategori error:

- Multer upload errors
- JWT errors
- Mongoose validation errors
- MongoDB duplicate key errors
- Custom operational errors melalui `AppError`
- Unexpected server errors

Response error menggunakan format:

```json
{
  "error": {
    "message": "Error message",
    "status": 400
  }
}
```

## ⚙️ Environment Variables

Buat file `.env` di root project untuk local development.

```env
PORT=5000
NODE_ENV=development

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>

JWT_ACCESS_SECRET=<your-access-secret>
JWT_REFRESH_SECRET=<your-refresh-secret>
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=image-manager

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=
IMAGEKIT_FOLDER=/image-manager

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=images
```

Minimal requirement untuk menjalankan authentication dan database adalah:

```env
MONGODB_URI=...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

Untuk upload, setidaknya satu storage provider harus dikonfigurasi.

> **Jangan commit `.env` atau credential provider ke repository.**

## 🛠️ Installation

### 1. Clone repository

```bash
git clone https://github.com/Rlawliet7/Pinterest-Lite.git
cd Pinterest-Lite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Buat `.env` dan isi environment variables yang diperlukan.

### 4. Run development server

```bash
npm run dev
```

Server akan berjalan pada:

```text
http://localhost:5000
```

### 5. Run production-style local server

```bash
npm start
```

## ☁️ Deployment

Project dikonfigurasi untuk **Vercel**.

Vercel menggunakan:

```text
api/index.js
```

sebagai serverless function. File tersebut memastikan koneksi MongoDB tersedia sebelum request diteruskan ke Express app.

`vercel.json` mengatur routing antara:

```text
/api/*  → api/index.js
/css/*  → frontend/css/*
/js/*   → frontend/js/*
/*.html → frontend/*.html
```

Environment variables harus ditambahkan pada **Vercel Project Settings → Environment Variables**.

### Live Deployment

**https://pinterest-lite-rust.vercel.app/**

## 🔄 Local vs Vercel

### Local

```text
server.js
   │
   ▼
connectDB()
   │
   ▼
app.listen(PORT)
```

### Vercel

```text
Request
   │
   ▼
api/index.js
   │
   ▼
ensureConnected()
   │
   ▼
Express app
```

Koneksi MongoDB menggunakan caching melalui `globalThis` agar koneksi dapat digunakan kembali pada environment serverless yang sama dan mengurangi pembuatan koneksi baru yang tidak perlu.

## 📦 Main Dependencies

| Package | Purpose |
|---|---|
| Express | REST API server |
| Mongoose | MongoDB ODM |
| Multer | Multipart file upload |
| bcrypt | Password hashing |
| jsonwebtoken | JWT authentication |
| Cloudinary | Image storage provider |
| ImageKit | Image storage provider |
| Supabase JS | Supabase Storage provider |
| CORS | Cross-origin request handling |
| dotenv | Environment configuration |
| Nodemon | Development server |

## 🔒 Security Notes

Project ini menerapkan beberapa basic security practice:

- Password tidak disimpan dalam bentuk plaintext
- Password hash tidak diekspos melalui JSON response
- Access endpoint dilindungi JWT middleware
- Refresh token disimpan sebagai SHA-256 hash di database
- Refresh token dapat di-revoke
- Refresh token menggunakan rotation
- Delete image melakukan ownership check
- Upload membatasi MIME type dan ukuran file
- Credential storage provider menggunakan environment variables

Beberapa peningkatan yang dapat dilakukan untuk production:

- Pindahkan refresh token dari `localStorage` ke HttpOnly Secure Cookie
- Tambahkan rate limiting
- Tambahkan stricter CORS policy
- Tambahkan request validation/schema validation
- Tambahkan pagination pada feed
- Tambahkan image transformation/optimization
- Tambahkan observability dan structured logging

## 🎯 Project Purpose

Project ini berfokus pada penerapan konsep **image database dan object storage** dalam aplikasi web full-stack. MongoDB digunakan sebagai database metadata, sedangkan file gambar dikelola oleh object/image storage provider.

Konsep ini memungkinkan aplikasi untuk membandingkan dan menggunakan beberapa storage provider melalui interface service yang sama tanpa mengubah alur utama controller upload.

## 📄 License

This project is intended as a mini project / learning project.
