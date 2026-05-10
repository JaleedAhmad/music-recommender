# AuraBeat Deployment Guide 🌐

This guide will help you deploy AuraBeat to the web using free hosting services and secure configurations.

## Prerequisites
1. A [GitHub](https://github.com) account.
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account (for the database).
3. A [Render](https://render.com) account (for the backend).
4. A [Vercel](https://vercel.com) account (for the frontend).

---

## Step 1: Database Setup (MongoDB Atlas)
1. Create a **Shared Cluster** (Free).
2. Create a Database User with a secure password.
3. In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. Get your **Connection String** (URI). It should look like: `mongodb+srv://<user>:<password>@cluster.mongodb.net/aurabeat?retryWrites=true&w=majority`

---

## Step 2: Backend Deployment (Render)
1. Push your code to a GitHub repository.
2. Log in to Render and click **New > Web Service**.
3. Connect your GitHub repository.
4. Settings:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. **Environment Variables**: Add the following:
   - `MONGODB_URI`: Your MongoDB Atlas URI.
   - `GEMINI_API_KEY`: Your Google AI Studio key.
   - `YOUTUBE_API_KEY`: Your YouTube Data API key.
   - `JWT_SECRET`: A long, random string (e.g., `openssl rand -base64 32`).
   - `NODE_ENV`: `production`
   - `FRONTEND_URL`: Your Vercel URL (Update this after Step 3).

---

## Step 3: Frontend Deployment (Vercel)
1. Log in to Vercel and click **Add New > Project**.
2. Connect your GitHub repository.
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**: Add:
   - `VITE_API_URL`: Your Render backend URL (e.g., `https://aurabeat-backend.onrender.com`).

---

## Step 4: Security Checklist ✅
- [x] **Environment Variables**: Never commit `.env` to Git (handled by `.gitignore`).
- [x] **CORS**: Configured to only allow your frontend domain.
- [x] **Rate Limiting**: Prevents brute force on API endpoints.
- [x] **HTTP Headers**: Secured via `helmet`.
- [x] **Password Hashing**: Secured via `bcryptjs`.
- [x] **Data Sanitization**: Prevents NoSQL injection.

---

## Useful Commands
- Build frontend locally: `cd frontend && npm run build`
- Start backend locally: `cd backend && npm start`
