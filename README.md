# StepUp Shoes — Premium Footwear E-Commerce Platform

> A production-grade, zero-cost architecture shoe e-commerce platform inspired by the full-featured experience of **Bata Bangladesh**, built specifically for Bangladeshi shoppers and modern footwear retailers.

![Comfort Leather Branding](public/img/logo.svg)

---

## 🌟 Key Highlights & Architectural Innovations

- **Zero-Cost Deployment Ready**: Runs effortlessly on free-tier infrastructure (Render / Fly.io + MongoDB Atlas M0 + Cloudinary Free Tier).
- **Zero-Setup Local Development**: Automatically starts an in-memory MongoDB instance and seeds **40 realistic footwear products**, categories, brands, banners, and store locations if no database connection is detected.
- **Harmonious CSS Coexistence**: Utilizes **Bootstrap 5** for grid layouts, modals, offcanvas navigation, and carousels alongside **Tailwind CSS** (namespaced with `tw-` prefix and preflight disabled) for pixel-perfect bespoke styling.
- **Bangladesh Localization**:
  - Currency formatted to Bangladesh standard: `Tk 1,299.00` (`en-BD` locale).
  - 8 Geographic Divisions and 64 Districts dynamic checkout cascading dropdowns.
  - Cash on Delivery (COD) as first-class payment method.
  - bKash & Nagad Send Money / Merchant payments with Transaction ID (`TrxID`) verification.
  - Integrated Courier tracking (Pathao Express, Steadfast, In-house delivery riders).
  - Club StepUp Loyalty Rewards (Earn 1 pt per Tk 100 spent, redeem 1 pt = Tk 1 discount).
- **High-Performance & SEO-Optimized**:
  - Semantic HTML5, Schema.org product structured microdata, automated XML sitemap (`/sitemap.xml`), and search engine directive (`/robots.txt`).
  - Ultra-lightweight `/healthz` keep-alive ping route to prevent free host sleeping.
  - Responsive image optimization with Cloudinary auto-format/auto-quality and instant local disk fallback.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18.0.0 or v20.x LTS
- **npm**: v9.x or later

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <repository-url>
cd "Comfort Leather"
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
BASE_URL=http://localhost:5000

# Database (Optional for local development — if empty or unreachable, in-memory MongoDB auto-starts!)
MONGODB_URI=mongodb://127.0.0.1:27017/stepup_shoes

# Security
JWT_SECRET=super_secret_stepup_shoe_jwt_key_2026
JWT_EXPIRES_IN=7d

# Cloudinary (Optional — uses /public/uploads/ local storage if not provided)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email / Nodemailer (Optional — logs simulated emails to console if omitted)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM="StepUp Shoes <support@stepupshoes.com.bd>"
```

### 4. Build Styles & Seed Data
```bash
# Compile Tailwind CSS (namespaced to tw-)
npm run build:css

# Seed database with 40 demo shoes, brands, collections, coupons, and admin account
npm run seed
```

### 5. Start the Server
```bash
npm start
```
- **Storefront**: [http://localhost:5000](http://localhost:5000)
- **Admin Control Panel**: [http://localhost:5000/admin](http://localhost:5000/admin)
- **Keep-Alive Health Route**: [http://localhost:5000/healthz](http://localhost:5000/healthz)

---

## 🔐 Default Admin Credentials

| Field | Value |
|---|---|
| **Login URL** | `/admin/login` |
| **Email** | `admin@example.com` |
| **Password** | `Admin@StepUp2026` |
| **Role** | `admin` |

---

## 📖 Admin Guide: How to Add Your First Product in 2 Minutes

1. **Log in to Admin**: Go to `http://localhost:5000/admin` and enter the credentials above.
2. **Open Product Creator**: Click **Products** in the left sidebar, then click the **"+ Add New Shoe"** button.
3. **Fill Basic Details**:
   - **Product Name**: e.g., *"StepUp Heritage Full-Grain Derby"*
   - **Gender**: Select *Men*, *Women*, or *Children*.
   - **Brand**: Select one of the 10 included brands (e.g., *StepUp Signature*, *Apex*, *North Star*, *Power*).
   - **Category**: Select the category (e.g., *Formal Shoes*, *Sneakers*, *Loafers*).
4. **Set Pricing & Flags**:
   - **Regular Price (BDT)**: e.g., `3490`
   - **Sale Price (BDT)**: e.g., `2990` (Leave blank if not on discount)
   - **Badges**: Check *Just Landed*, *Best Seller*, or *Featured*.
5. **Upload Images**:
   - Drag & drop or select primary shoe photo and hover alternate angle.
   - If Cloudinary credentials are set in `.env`, images upload instantly with CDN optimization; otherwise, they are stored securely in `/public/uploads/`.
6. **Define Color & Size Matrix**:
   - Add a color name (e.g. *Burnished Tan*, Hex `#964B00`).
   - Click **+ Add Size** for each size:
     - Size: `40`, Stock: `15`, SKU: `DERBY-TAN-40`
     - Size: `41`, Stock: `25`, SKU: `DERBY-TAN-41`
     - Size: `42`, Stock: `20`, SKU: `DERBY-TAN-42`
7. **Save & Publish**:
   - Click **Publish Product**. Your new shoe is immediately available on the storefront homepage, category listing, live search suggestions, and mobile navigation!

---

## 🛠️ Zero-Cost Cloud Deployment (Step-by-Step)

You can run StepUp Shoes indefinitely with **zero recurring infrastructure bills** using the free tiers of Render, MongoDB Atlas, and Cloudinary.

### Step 1: Free MongoDB Atlas Cluster (M0)
1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **Shared Cluster (M0 Free)** in the `ap-southeast-1` (Singapore) or `ap-south-1` (Mumbai) region for lowest latency to Bangladesh.
3. In **Database Access**, create a user (e.g. `stepup_app`) with read/write access.
4. In **Network Access**, add IP `0.0.0.0/0` (Allow Access from Anywhere).
5. Copy your connection string:
   ```
   mongodb+srv://stepup_app:<password>@cluster0.abcde.mongodb.net/stepup_shoes?retryWrites=true&w=majority
   ```

### Step 2: Free Cloudinary Media Storage
1. Sign up at [cloudinary.com](https://cloudinary.com) (25 GB free monthly managed storage & bandwidth).
2. Note your **Cloud Name**, **API Key**, and **API Secret** from the dashboard.

### Step 3: Free Web Hosting on Render
1. Sign up at [render.com](https://render.com).
2. Click **New +** -> **Web Service** and link your Git repository.
3. Configure settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx tailwindcss -i ./src/input.css -o ./public/css/tw.css --minify`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: `Free`
4. In **Environment Variables**, add:
   - `NODE_ENV` = `production`
   - `BASE_URL` = `https://your-service-name.onrender.com`
   - `MONGODB_URI` = *(your Atlas connection string)*
   - `JWT_SECRET` = *(a random 64-character string)*
   - `CLOUDINARY_CLOUD_NAME` = *(from step 2)*
   - `CLOUDINARY_API_KEY` = *(from step 2)*
   - `CLOUDINARY_API_SECRET` = *(from step 2)*
5. Click **Deploy Web Service**.
6. Once deployed, run the one-time database seed via Render Shell:
   ```bash
   npm run seed
   ```

### Step 4: Keep-Alive Ping (Preventing Cold Starts)
Render free instances go to sleep after 15 minutes of inactivity. To keep your store instant and blazing-fast 24/7:
1. Register for free at [cron-job.org](https://cron-job.org) or [uptimerobot.com](https://uptimerobot.com).
2. Create a monitor targeting your healthz endpoint:
   - **URL**: `https://your-service-name.onrender.com/healthz`
   - **Interval**: Every 14 minutes.
   - **Expected Status**: `200 OK`
This keeps your container active with zero cost and zero cold starts!

---

## 🛒 Storefront Features

1. **Sticky Topbar & Brand Header**:
   - Announcement bar with discount promo codes.
   - Live predictive search with image previews and instant price matching.
   - Mobile bottom navigation bar for high conversion on handheld devices.
2. **Bata Bangladesh-Style Mega Menu**:
   - Multi-column dropdowns categorized by gender, collection, brand, and accessories.
3. **Interactive Homepage**:
   - Hero carousel with responsive banners and promo badges.
   - Circular "Shop by Gender" quick visual shortcuts.
   - "Just Landed" tabbed product showcase with instantaneous client-side filter.
   - High-impact promotional promotional split banners.
   - Dedicated "Handcrafted Leather" luxury spotlight.
   - 10 Brand logo grid (StepUp, Apex, Power, North Star, Comfit, Marie Claire, Weinbrenner, Bubblegummers, Hush Puppies, Sandak).
   - "StepUp Stories" style journal articles.
   - Newsletter signup with validation.
4. **Rich Collection & Catalog Browser**:
   - Multi-faceted sidebar filter: Price sliders (e.g. Under Tk 1,000, Tk 1,001 - 1,500, Above Tk 5,000), Brand checkboxes, Color swatches, and Footwear size chips (Size 3 to 13).
   - Sort by Newest, Price Low-to-High, Price High-to-Low, and Best Selling.
5. **Product Detail Experience**:
   - High-resolution gallery image zoom.
   - Color swatch selector with dynamic hex palette.
   - Footwear size chips showing real-time stock levels.
   - Direct "Order on WhatsApp" button with pre-filled product name, selected size, and URL.
   - Interactive Size Guide modal with conversion charts (EU, UK, US, CM).
   - Customer review submission with 1-5 star ratings.
6. **Cart & Dynamic Checkout**:
   - Slide-over cart drawer + full shopping cart page.
   - Promo coupon verification engine (`WELCOME10`, `EID2026`, `STEPUP500`).
   - Dynamic Bangladesh delivery calculation (Inside Dhaka: Tk 60, Outside Dhaka: Tk 120, Free on Tk 2,500+).
   - bKash / Nagad payment instructions with TrxID recording.
7. **Order Tracking & Account Portal**:
   - 4-stage visual order stepper (Pending -> Processing -> Shipped -> Delivered).
   - Customer account history, printable receipts, and Club StepUp points balance ledger.

---

## 📂 Project Architecture

```
Comfort Leather/
├── public/                     # Static client assets
│   ├── css/
│   │   ├── bootstrap.min.css   # Bundled Bootstrap 5.3.3
│   │   └── tw.css              # Compiled namespaced Tailwind CSS (tw-*)
│   ├── js/
│   │   └── bootstrap.bundle.min.js
│   ├── img/                    # Brand SVG logos, banners, placeholders
│   └── uploads/                # Local disk fallback upload storage
├── src/
│   └── input.css               # Tailwind CSS root input
├── server/
│   ├── config/                 # Env, MongoDB, and Cloudinary configurations
│   ├── controllers/            # Admin, Auth, Product, Order, Content controllers
│   ├── middleware/             # Auth, AdminOnly, RateLimiter, Multer, Error handlers
│   ├── models/                 # 15 Mongoose schemas
│   ├── routes/                 # Admin, API, and Public routes
│   ├── seeds/                  # Seed dataset (40 products, categories, stores, etc.)
│   ├── services/               # Pricing (BDT), Orders, Cloudinary, Mailers
│   └── index.js                # Express app entrypoint
├── views/
│   ├── admin/                  # 19 Admin management views & printable templates
│   ├── layouts/                # main.ejs and admin.ejs layouts
│   ├── pages/                  # Storefront pages (Home, Collection, Product, Cart, Checkout, etc.)
│   └── partials/               # Reusable headers, mega-menus, drawers, cards, footers
├── package.json
├── tailwind.config.js
└── README.md
```

---

## 📄 License & Attribution

Designed and engineered for **StepUp Shoes**. Handcrafted with pride for Bangladesh footwear retail.
