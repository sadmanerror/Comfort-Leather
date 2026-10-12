# MASTER BUILD PROMPT: Shoe E-Commerce Website (Bata Bangladesh style)

You are a senior full-stack engineer. Build a complete, production-ready shoe e-commerce website (storefront + backend API + admin panel) modeled on the structure and UX of batabd.com. Follow every section below. Ask no questions; where something is unspecified, choose a sensible default and note it in README.md.

---

## 0. HARD CONSTRAINTS

1. **Zero cost.** Every service must have a permanent free tier. No paid plans, no trials, no credit card required.
2. **Frontend styling uses BOTH Bootstrap 5 and Tailwind CSS** (rules in section 3).
3. **Original branding.** Use the placeholder brand `{{BRAND_NAME}}` (default: "StepUp") with a simple text/SVG logo. Do NOT copy Bata's logo, trademarks, product photos, or copyrighted text. Seed data uses placeholder images and original copy.
4. **Mobile-first and fast.** Target Lighthouse 90+ on mobile for Performance and SEO.
5. **Currency is BDT, displayed as `Tk 1,299.00`.** Locale `en-BD`.

---

## 1. TECH STACK (all free)

| Layer | Choice | Why |
|---|---|---|
| Runtime / Server | Node.js 20 + Express.js | Simple, free to host |
| Views | EJS (server-rendered) + small vanilla JS modules | Good SEO, no heavy framework |
| Database | **MongoDB Atlas free tier (M0)** via Mongoose | Free forever, flexible for product variants |
| Image + Video storage | **Cloudinary free plan** | Free CDN, auto format/compress, handles images AND video, so nothing heavy goes in the DB |
| Auth | JWT in httpOnly cookies + bcrypt | No paid auth service |
| Email | Nodemailer with Gmail SMTP app password (or Brevo free tier) | Order confirmation, password reset |
| Hosting | Render free web service (or Railway/Fly free allowance) | Note: free instances sleep after inactivity; add a cheap keep-alive ping route `/healthz` |
| Validation | Zod or express-validator | |
| Security | helmet, express-rate-limit, cors, csurf (or SameSite cookies), mongo-sanitize | |

**Storage rule:** The database stores only text, numbers, and Cloudinary URLs/public IDs. Never store image or video binaries in MongoDB.

**Media rules:**
- Product images: upload original, then serve through Cloudinary transformations (`f_auto,q_auto,w_400` for cards, `w_900` for detail, `w_1600` for zoom).
- Videos: allow short MP4 clips (max 15 MB, max 20 seconds) for hero banners and product videos. Serve with `autoplay muted loop playsinline preload="none"` plus a poster image. Lazy-load below the fold.
- Use `loading="lazy"`, `srcset`/`sizes`, and explicit width/height to avoid layout shift.
- Include a note in the README that free-tier limits can change, so the owner should verify current Cloudinary and Atlas quotas.

---

## 2. PROJECT STRUCTURE

```
/server
  /config        (db.js, cloudinary.js, env.js)
  /models        (User, Product, Category, Brand, Collection, Banner, Order, Coupon, Review, BlogPost, Wishlist, Setting, Newsletter)
  /controllers
  /routes        (public routes, /api routes, /admin routes)
  /middleware    (auth, adminOnly, upload, errorHandler, validate)
  /services      (cloudinaryService, mailService, orderService, pricingService)
  /seeds         (seed.js: demo categories, brands, 40 products, banners, admin user)
/views
  /layouts       (main.ejs, admin.ejs)
  /partials      (header, footer, product-card, mega-menu, search-overlay, cart-drawer, modals)
  /pages         (home, collection, product, cart, checkout, account, wishlist, blog, static)
  /admin         (all admin pages)
/public
  /css  /js  /img
tailwind.config.js, postcss.config.js, package.json, .env.example, README.md
```

---

## 3. HOW BOOTSTRAP AND TAILWIND COEXIST (important)

Using both can cause class clashes, so enforce this:

- **Bootstrap 5** handles: grid (`container`, `row`, `col-*`), navbar/collapse, offcanvas (mobile menu + cart drawer), modals (login, size chart, quick view), carousels, dropdowns, toasts, accordions, tabs, pagination, forms and validation states.
- **Tailwind** handles: spacing, typography, colors, hover effects, aspect ratios, transitions, custom product-card and banner styling.
- In `tailwind.config.js`: set `prefix: 'tw-'` and `corePlugins: { preflight: false }` so Tailwind never overrides Bootstrap's reset. Example usage: `class="btn btn-dark tw-rounded-none tw-uppercase tw-tracking-wide"`.
- Build Tailwind with the CLI (`tailwindcss -i ./src/input.css -o ./public/css/tw.css --minify`), add `npm run build:css` and `npm run dev` scripts.
- Load Bootstrap from the npm package (bundled/local, not a CDN) for the public site and admin.
- Define brand colors as CSS variables and Tailwind theme extension: primary red `#D6001C`-style accent (pick your own original red), black, white, light gray `#F5F5F5`.
- Font: Google Font "Poppins" or "Montserrat" (self-hosted or with `display=swap`).

---

## 4. STOREFRONT: GLOBAL LAYOUT (mirrors the reference site)

### 4.1 Top utility bar
Slim dark bar: **"Find A Store | Customer care: 09666200300"** (phone and store-locator link both editable from admin Settings).

### 4.2 Header (sticky)
- Left: hamburger (mobile only), logo.
- Center (desktop): mega-menu.
- Right: Search icon, User icon (opens login modal; if logged in, goes to account), Wishlist heart, Cart icon with live item count badge.
- Floating **WhatsApp chat button** bottom-right (number from Settings).
- Floating "Back to top" button.

### 4.3 Search overlay (full-width slide-down)
- Input with live suggestions (debounced 300ms, `/api/search?q=`), showing top 6 matching products with thumbnail, name, price.
- **"Trending" chips** under the input (default: Power, Northstar, Loafer, Sandal, Heel, Casual Shoe; editable in admin).
- "Popular Products" row beneath.

### 4.4 Mega-menu structure (data-driven from DB, not hardcoded)
Top-level items, in order:
1. **Discounted Product**
2. **Sneaker Studio** (a landing page)
3. **Brands**: dropdown listing all active brands (Bata, Comfit, Floatz, Hush Puppies, North Star, Power, Red Label, Scholl, Weinbrenner, Adidas, as seed examples; use original placeholder brand names in seeds)
4. **MEN**: columns: *All Shoes* (Apparel, Casual Shoes, Formal Shoes, Sandals, Moccasins, Sports) | *Brands* | *By Color* (Black, Blue, Brown, Gray, Green, Red, Pink, Yellow, White) | *By Price* (Under Tk 1000, 1001-1500, 1501-2000, 2001-3000, 3001-4000, 4001-5000, Above 5000) | *By Size* (5 to 11)
5. **WOMEN**: same columns; categories: Apparel, Ladies Sandals, Ladies Heel, Ladies Sports Shoes, Closed Shoes (Casual & Formal); sizes 3 to 7
6. **CHILDREN**: Boys (Sandal, Sports, Casuals), Girls (Sandal, Sports, Casuals), plus Brands, Color, Price, Size 1 to 13
7. **ACCESSORIES**: Bags (Backpack, Ladies Handbags), Belts, Wallets, Shoe Care, Apparel, with brand sub-list
8. **Digital Vouchers**
9. **Loyalty Club**: Check points, Register, Benefits

Desktop: hover opens a full-width mega panel with columns. Mobile: Bootstrap offcanvas with accordion sections. Menu items and their children are managed in admin (Menu Builder), seeded with the above.

---

## 5. STOREFRONT: HOME PAGE (section order)

1. **Hero slider** (Bootstrap carousel): up to 10 slides, each with a separate desktop image (about 1920x700) and mobile image (about 450x300), plus optional video background, link, and alt text. Autoplay 5s, pause on hover, dots + arrows. Fully admin-managed.
2. **Gender category tiles**: Men / Women / Kids, three large image cards with overlay title.
3. **Accessories banner** (full-width image link).
4. **Voucher/gift-card strip banner** (full-width, link to vouchers).
5. **Best Seller** product carousel (Swiper.js free, or Bootstrap carousel multi-item): 4 per view desktop, 2 mobile.
6. **Just Landed** with tabs: Casuals, Sneakers, Ladies Flats, Sandals, Formals, Accessories. Tab switch loads products via AJAX (`/api/products?tag=just-landed&category=...`).
7. **Hand-picked collection**: two large promo cards (e.g., "North Star Curated", "Men's Casual") each with image, heading, short copy, and Shop Now button.
8. **Featured Products** grid (8 to 24, with "Load more").
9. **Pick Your Favourites**: three feature cards (Ladies Casual, Men's Formals, Ladies Bags) with image, label, heading, paragraph, button.
10. **Recent Posts**: latest 2 to 3 blog posts (image, author, date, excerpt, Read More).
11. **Instagram strip**: grid of 6 to 11 square images linking to Instagram posts (admin enters image + URL; no Instagram API needed).
12. **Footer**.

---

## 6. PRODUCT CARD (reusable partial `product-card.ejs`)

Every card shows:
- Primary image, and **second image on hover** (swap with fade).
- **"Sale" badge** top-left (shown when sale price exists; optionally show `-20%`).
- **Wishlist heart** top-right (toggles via AJAX; guests use localStorage, synced on login).
- **Size chips row** under the image: show first 4 available sizes as small links, then a `+N` chip if more. Out-of-stock sizes are struck through.
- Brand name (links to brand collection).
- Product name (2-line clamp).
- Price: **old price struck through + sale price in accent color**, e.g. `Tk 1,140.00  Tk 912.00`.
- Color name label under the price.
- **"Shop now"** button (goes to product page). For gift cards/accessories with a single variant, show **"Add to Cart"** instead.
- Optional quick-view and compare icons that appear on hover (desktop).

---

## 7. COLLECTION / LISTING PAGES

Routes: `/collections/:slug`, `/search?q=`, `/collections/men?constraint=black`.
- Breadcrumbs, title, product count, banner image per collection.
- **Left filter sidebar** (offcanvas on mobile): Brand (checkboxes), Color (swatches), Price (the preset ranges above + custom min/max slider), Size (chips), Category, Availability, "On sale only".
- Sort: Featured, Newest, Price low-high, Price high-low, Best selling, Discount %.
- Active-filter chips with "Clear all".
- Pagination (24 per page) or infinite scroll with a "Load more" button. URL stays shareable (query params).
- Server-side filtering with MongoDB indexes on `category`, `brand`, `gender`, `price`, `colors`, `sizes.size`.

---

## 8. PRODUCT DETAIL PAGE

- Gallery: thumbnails + main image, zoom on hover (desktop), pinch/swipe (mobile), optional product video as the last item.
- Title, brand, SKU, rating stars + review count, price block (old/new + "You save Tk X").
- **Color selector** (links to sibling color variants or swatches).
- **Size selector** chips showing stock state; **"Size Chart" link opens a modal** with an admin-uploaded chart image. Quantity stepper.
- **Add to Cart**, **Buy Now**, **Add to Wishlist**, WhatsApp "Order via WhatsApp" button (prefilled message with product name and URL).
- Delivery/returns info accordion, product description, specs (material, sole, closure, occasion), care instructions.
- Reviews with star rating, verified-buyer tag, and a submit form (moderated in admin).
- "You may also like" and "Recently viewed" carousels.
- JSON-LD `Product` schema, Open Graph tags.

---

## 9. CART, CHECKOUT, ORDERS

- **Cart drawer** (Bootstrap offcanvas, right side): items with thumbnail, size, color, qty stepper, remove, subtotal, "View Cart", "Check out now". Empty state: "Your cart is currently empty" + Continue Shopping.
- Cart persists in localStorage for guests and DB for logged-in users; merge on login.
- Stock validated server-side on every cart change and at checkout.
- **Guest checkout allowed.** Fields: full name, phone (BD format validation `01XXXXXXXXX`), email (optional), division / district / area dropdowns (seed BD data), full address, order note.
- Shipping: flat rate inside Dhaka vs outside Dhaka, free above a threshold (all editable in Settings).
- Coupon / voucher code box with server validation.
- **Payment methods (all free to implement):**
  1. Cash on Delivery (default)
  2. bKash / Nagad manual payment: show the merchant number and ask the customer for the Transaction ID; admin verifies and marks paid
  3. Optional: SSLCommerz **sandbox** integration behind a feature flag (document that live use needs a merchant account)
- Order confirmation page + email with order number (`ORD-YYYYMMDD-XXXX`).
- Order statuses: Pending, Confirmed, Packed, Shipped, Delivered, Cancelled, Returned. Customer can track by order number + phone at `/track-order`.
- Stock decrements on confirmation, restores on cancel/return.

---

## 10. CUSTOMER ACCOUNT

Register / login / logout / forgot-reset password (email token). Dashboard with: profile, saved addresses, order history with status timeline, wishlist page, loyalty points balance (earn 1 point per Tk 100 spent, configurable), and newsletter opt-in. Login also works from the header modal.

---

## 11. LOYALTY, VOUCHERS, GIFT CARDS

- **Digital gift cards** are products with fixed denominations (Tk 1000, 4000, 5000) and a generated redeemable code emailed after payment.
- **Coupons**: percent or fixed, min order, max uses, per-user limit, start/end date, category/brand restrictions.
- **Club points**: ledger collection; redeem at checkout.

---

## 12. CONTENT PAGES

Static pages editable from admin (rich text editor): About Us, Careers, Terms & Conditions, Privacy Policy, Payment Options, EMI Policy, Coverage Areas, FAQs, Contact Info, All About Feet (foot-care guide), Store Locator (list of stores with address, phone, hours, Google Maps link; filter by city). Blog (`/blogs/stories`) with list + post pages.

---

## 13. FOOTER

Columns: **About** (About Us, Careers, Awards, Investors, Franchise), **Information** (Terms, Payment Options, Privacy, EMI, Coverage), **Popular Brands**, **Customer Service** (FAQs, Stores, All About Feet, Contact). Contact block (company name, address, phone with hours, support email). **Newsletter signup** form. Social icons (Facebook, Instagram, YouTube, Twitter/X). Payment icons (Visa, Mastercard, Amex, bKash, Nagad, COD). Copyright line auto-updates the year.

---

## 14. ADMIN PANEL (clean, simple, built for non-technical staff)

Route: `/admin` (separate login, role-based: `admin`, `staff`). Layout: left sidebar (collapsible), top bar with search + profile, Bootstrap cards, Tailwind spacing. Light theme, big readable buttons, helpful placeholder text and tooltips, toast notifications for every action, confirm dialogs for deletes, autosave drafts on long forms, fully responsive (usable on a phone).

### 14.1 Dashboard
KPI cards: today's orders, revenue (today/7d/30d), pending orders, low-stock count, new customers. Charts (Chart.js, free): sales over time, top 5 products, orders by status. Lists: latest 10 orders, low-stock alerts.

### 14.2 Products (the most important part, make adding fast)
**List page:** table with thumbnail, name, SKU, brand, category, price, sale price, total stock, status toggle (Published/Draft), badges (Best Seller, Just Landed, Featured). Search, filters (brand, category, gender, stock, status), bulk select with actions (publish, unpublish, delete, set sale %, add to collection), **inline quick-edit of price and stock**, row action "Duplicate".

**Add/Edit product form** (single page, sectioned cards, sticky Save button):
1. **Basic info:** Name, auto-generated slug (editable), Brand (dropdown + "add new"), Gender (Men/Women/Boys/Girls/Unisex), Category and Sub-category (dependent dropdowns), Short description, Full description (rich text).
2. **Pricing:** Regular price, **Sale price OR discount %** (typing one auto-calculates the other), live preview of how the price will look, optional sale start/end dates.
3. **Variants (Color + Size matrix):**
   - Add color rows: color name, color swatch picker, images for that color.
   - Under each color, **tick sizes from a preset list** (men 5-11, women 3-7, kids 1-13) and type **stock per size** in one grid. SKU auto-generated per variant (editable).
   - "Apply same stock to all sizes" shortcut.
4. **Media:** drag-and-drop multi-image upload straight to Cloudinary with progress bars, drag to reorder, star to set primary, pick the "hover image", alt text per image, delete. Optional **product video** upload (MP4, size/duration validated, preview player). Client-side image compression before upload.
5. **Merchandising flags:** Best Seller, Just Landed (auto-expires after N days), Featured, Discounted; assign to collections; tags.
6. **Details:** Material, sole, closure, occasion, care instructions, size-chart override.
7. **SEO:** meta title, meta description, auto-filled from name/description.
8. **Status:** Draft / Published, with "Save & add another" and "Save & view on site".

**Bulk tools:** CSV/Excel import with downloadable template and row-level error report; bulk image upload that matches filenames to SKUs; export products to CSV.

### 14.3 Catalog management
Categories (tree, drag to reorder, image, SEO), Brands (logo, description, active toggle), Collections (manual pick or rule-based, e.g., "brand = X AND price < 2000"), Filters presets (colors, size sets, price ranges), **Menu Builder** (drag-drop mega-menu).

### 14.4 Storefront content
Hero Banners (desktop image, mobile image, optional video, link, order, active toggle, schedule start/end), Homepage sections manager (reorder/enable/disable sections from section 5, edit headings and promo cards), Trending search terms, Instagram strip, Static pages editor, Blog manager (rich text, cover image, publish date), Store locator entries, Size chart images.

### 14.5 Orders
List with status tabs and filters (date, payment status, area). Order detail: items, customer info, address, payment info with "Mark as paid" and TrxID display, status dropdown with timeline log, internal notes, printable **invoice and packing slip** (print CSS), cancel/refund note. Bulk status update. Export orders CSV.

### 14.6 Customers, Reviews, Marketing
Customers list with order count and lifetime spend. Reviews moderation (approve/hide/delete). Coupons and gift-card manager. Newsletter subscribers list with CSV export.

### 14.7 Settings
Store name, logo, favicon, contact phone, WhatsApp number, email, address, social links, shipping rates and free-shipping threshold, payment method toggles and merchant numbers, loyalty rules, currency format, tax display, SMTP config, announcement bar text, maintenance mode. Admin user and role management with password change.

---

## 15. DATA MODELS (Mongoose, key fields)

- **Product:** name, slug, brand(ref), gender, category(ref), subCategory(ref), shortDesc, description, price, salePrice, saleStart, saleEnd, colors[{name, hex, images[{url, publicId, alt, isPrimary, isHover}], sizes[{size, stock, sku}]}], video{url, publicId}, tags[], flags{bestSeller, justLanded, featured}, specs{}, seo{}, status, ratingAvg, ratingCount, soldCount, createdAt. Text index on name/brand/tags.
- **Order:** orderNo, user?, guestInfo, items[{product, name, image, color, size, qty, price}], subtotal, discount, shipping, total, coupon, payment{method, status, trxId}, status, statusHistory[], address{}, note.
- **User:** name, email, phone, passwordHash, role, addresses[], points, wishlist[].
- Others: Category, Brand, Collection, Banner, Coupon, Review, BlogPost, Setting (singleton), Menu, Newsletter, PointsLedger.

---

## 16. API (REST, JSON) AND SECURITY

Public: `/api/products`, `/api/products/:slug`, `/api/search`, `/api/cart/*`, `/api/wishlist/*`, `/api/orders`, `/api/auth/*`, `/api/reviews`, `/api/newsletter`.
Admin (auth + role middleware): full CRUD on every model, `POST /api/admin/upload` (signed Cloudinary upload), CSV import/export, stats.
Security: password hashing, rate limits on auth and checkout, input validation and sanitization, CSRF protection, secure/httpOnly/SameSite cookies, helmet CSP allowing Cloudinary, file type and size checks, no secrets in the repo (`.env.example` only), admin routes never exposed to the public layout.

---

## 17. PERFORMANCE, SEO, ACCESSIBILITY

Gzip/Brotli compression, cache headers for static assets, lazy-loaded images/videos, minified CSS/JS, critical CSS for above-the-fold. Auto-generated `sitemap.xml` and `robots.txt`, canonical URLs, Open Graph/Twitter cards, JSON-LD (Organization, Product, BreadcrumbList). Semantic HTML, alt text, focus states, color contrast AA, keyboard-navigable menus and modals.

---

## 18. SEED DATA AND DELIVERABLES

1. `npm run seed` creates: admin user (`admin@example.com` / a random password printed once in the console), 10 brands, full category tree from section 4.4, 40 demo products with placeholder images, 6 banners, 3 collections, 5 coupons, 3 gift cards, 2 blog posts, default static pages.
2. `.env.example` with: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMTP_*`, `BASE_URL`.
3. **README.md** with step-by-step free setup: create MongoDB Atlas free cluster, create Cloudinary free account, set env vars, run locally (`npm install`, `npm run build:css`, `npm run seed`, `npm run dev`), deploy to Render free tier, set up the keep-alive ping, and a short **Admin Guide** ("How to add your first product in 2 minutes").
4. Everything runs with the commands above and no placeholder TODOs left in the code.

Build the whole project now, file by file, and verify it runs before finishing.
