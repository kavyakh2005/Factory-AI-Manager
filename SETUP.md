# 🛠️ Factory AI Manager — Setup & Quickstart Guide

> **Enterprise Garment Manufacturing ERP & AI Manager**  
> Running on **React 18 + Vite 6 + TypeScript + Tailwind CSS** connected to **Supabase PostgreSQL & Google Gemini AI**.

---

## 1. System Prerequisites

- **Node.js**: `v18.x`, `v20.x`, or `v22.x`
- **NPM**: `v9.x` or `v10.x`
- **Web Browser**: Chrome, Edge, Safari, Firefox, or Brave (Mobile, Tablet & Desktop supported)

---

## 2. Environment Variables Configuration (`.env`)

Create or update your [`.env`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/.env) file in the root directory:

```env
# Supabase PostgreSQL Cloud Configuration
VITE_SUPABASE_URL="https://mnnfdedjfffsogdiaoct.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# (Optional) Google Gemini API Key for AI Intelligence Engine
# Can also be dynamically configured via Settings or AI Manager UI modal
VITE_GEMINI_API_KEY="your-google-gemini-api-key"
```

---

## 3. Database Migration Setup (Supabase)

If deploying to a fresh Supabase instance, execute the SQL migrations in order via the **SQL Editor**:
1. [`supabase/migrations/20260309_init_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260309_init_schema.sql)
2. [`supabase/migrations/20260310_production_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260310_production_schema.sql)
3. [`supabase/migrations/20260312_full_factory_modules_schema.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/migrations/20260312_full_factory_modules_schema.sql)
4. [`supabase/enable_anon_access.sql`](file:///c:/Users/Kavya%20Khandelwal/OneDrive/Desktop/Factory/AI%20Manager/supabase/enable_anon_access.sql)

---

## 4. Running the Application

```bash
# 1. Install all dependencies
npm install

# 2. Type-check entire project (verifies 0 TypeScript errors)
npm run check

# 3. Launch local Vite development server
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## 5. Master Factory Owner Login Credentials

| Credential | Value |
| :--- | :--- |
| **Email** | `kavyakhandelwal57@gmail.com` |
| **Password** | `Kavya@2005` |
| **User Role** | `OWNER` (Full Master Administrative, Financial & Operational Access) |

---

## 6. Build & Production Deployment

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

The output bundle is generated inside `dist/` ready for zero-config deployment on Vercel, Netlify, Cloudflare Pages, or AWS S3/CloudFront.
