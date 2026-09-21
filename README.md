# Pharmacy Management System — MERN College Project

## Stack
- MongoDB + Mongoose
- Express.js
- React + Vite
- Node.js
- Axios

## Features
- User registration, login and logout (frontend logout/localStorage; no JWT/session authentication)
- Medicine CRUD and search
- Low-stock and expired medicine monitoring
- Cart and checkout
- Orders and stock reduction
- User profile
- Admin dashboard, medicine/user/order management

## Run backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

## Run frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

For Vercel, set `VITE_API_URL` to your Render backend URL and rebuild/redeploy.

## Create an admin
Registration always creates a normal user. For a college demo, change one MongoDB user's `role` field to `admin` in MongoDB Compass/Atlas after registration.

## Important
This is a college-project simulation. Backend admin endpoints are intentionally not protected with real authorization because the requested project omits authentication/authorization. Do not use this design for a real pharmacy system. Prescription-required medicines are only represented as a demo field; no prescription verification is implemented.

Express supports defining GET/POST/PUT/DELETE endpoints directly on the `app` object, which is the pattern used here. See the official routing guide: https://expressjs.com/en/guide/routing/
