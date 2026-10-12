# SHANZOO — Corporate Website (Frontend)

A fast, accessible, fully responsive marketing website for **SHANZOO**, a Toronto-based
company that helps organizations **manage, organize, secure, improve, connect and move**
their business data.

The frontend is semantic HTML5, modern CSS3 and vanilla JavaScript — **no framework**
(no React, Vue, Tailwind, Bootstrap or jQuery) and no build step required to *view* the
site. It is delivered by a small, secure **Express.js + MongoDB** backend that powers the
contact form and the sign-up, login and one-time-passcode (OTP) flows.

---

## Quick start

### 1. Preview the site

Because the pages are plain static files, you can open `index.html` directly in a browser.
For correct relative paths and to test everything as it behaves in production, serve the
folder over HTTP instead:

```powershell
# Any static server works. Examples:
npx serve .
# or
python -m http.server 8080
```

Then open the printed URL (e.g. `http://localhost:8080`).

### 2. Regenerate the HTML (only needed after editing content)

The HTML pages are **generated** from two Node scripts so that shared pieces (header,
footer, navigation, service catalogue, icons) stay consistent. You only need Node.js —
there are no npm dependencies.

```powershell
node tools/build.js
```

This rewrites every HTML file at the repository root, plus `sitemap.xml` and `robots.txt`.

> Node.js 16+ is recommended. No `npm install` is required.

---

## Project structure

```
shanzo/
├─ index.html                 # generated home page
├─ pages/                     # generated secondary pages
│  ├─ about.html              data-management.html   solutions.html
│  ├─ services.html           data-integration.html  industries.html
│  ├─ why-shanzoo.html        our-approach.html      insights.html
│  ├─ contact.html            login.html             signup.html
│  ├─ privacy.html            terms.html             404.html
│  └─ insights/               # generated article pages
├─ services/                  # generated individual service pages (10)
├─ css/
│  ├─ variables.css           # design tokens (colours, spacing, type)
│  ├─ reset.css               # modern reset / normalise
│  ├─ global.css              # base elements, layout, utilities
│  ├─ components.css          # buttons, cards, nav, forms, footer …
│  ├─ pages.css               # page-specific sections
│  └─ responsive.css          # media queries
├─ js/
│  ├─ main.js                 # entry point
│  ├─ navigation.js           # mega menu, mobile panel, active link
│  ├─ animations.js           # scroll reveals, back-to-top
│  ├─ components.js           # accordions, scroll-spy
│  └─ forms.js                # validation + future-backend hookup points
├─ assets/
│  ├─ logo/                   # optimised logo files
│  └─ icons/                  # favicons + site.webmanifest
├─ images/                    # original source assets (e.g. logo.png)
├─ server/                    # Express.js API — auth, contact, email
│  ├─ server.js               # local entry: connect to MongoDB, then listen
│  ├─ app.js                  # Express app: security, API routes, static site, 404
│  └─ config/ controllers/ middleware/ models/ routes/ services/ validators/
├─ api/
│  └─ index.js                # Vercel serverless entry (wraps the Express app)
├─ vercel.json                # Vercel build + routing configuration
├─ .env.example               # environment template (copy to .env)
└─ tools/
   ├─ data.js                 # site config, services, nav, icons, illustrations
   └─ build.js                # layout + page builders and file writer
```

### Generated vs. source files

Everything at the root and inside `pages/` and `services/` is **generated output**.
Edit the source in `tools/` (and the CSS/JS), then run `node tools/build.js`.
Direct edits to generated HTML will be overwritten on the next build.

---

## Editing content

| What you want to change            | Where                                            |
| ---------------------------------- | ------------------------------------------------ |
| Company name, address, phone, email| `tools/data.js` → `SITE`                          |
| Production domain (canonical/SEO)  | `tools/data.js` → `SITE.domain`                   |
| Service catalogue (10 services)    | `tools/data.js` → `SERVICES`                      |
| Page copy / sections               | the relevant `buildXxx()` function in `tools/build.js` |
| Colours, fonts, spacing            | `css/variables.css`                              |
| Blog / insight articles            | `tools/build.js` → `insights`, `ARTICLE_CONTENT`  |

### Production domain

`tools/data.js` has `SITE.domain` **empty** because a production domain has not been
confirmed yet. While it is empty:

- canonical `<link>` tags are omitted,
- `sitemap.xml` uses root-relative URLs,
- `robots.txt` points at `/sitemap.xml`.

Before launch, set it to your domain (without `https://`), then rebuild:

```js
domain: "example.com",
```

This enables absolute canonical tags and a standards-compliant sitemap.

---

## Running the full stack locally

The static site can be previewed on its own (see above), but the forms and the auth
flows need the Express backend:

```powershell
# 1. Install dependencies
npm install

# 2. Create your environment file and fill in real values
Copy-Item .env.example .env

# 3. Start the server (serves the API *and* the static site on one origin)
npm start          # http://localhost:3000
# or, for auto-restart during development
npm run dev
```

The backend refuses to boot when a required variable (MongoDB URI, `SESSION_SECRET`)
is missing, so misconfiguration surfaces immediately instead of at request time.

### API routes

| Method | Route                              | Purpose                               |
| ------ | ---------------------------------- | ------------------------------------- |
| GET    | `/api/health`                      | Liveness probe                        |
| POST   | `/api/contact`                     | Contact form submission               |
| POST   | `/api/auth/signup`                 | Start sign-up (emails an OTP)         |
| POST   | `/api/auth/verify-signup-otp`      | Verify the OTP and create the account |
| POST   | `/api/auth/resend-otp`             | Resend a one-time passcode            |
| POST   | `/api/auth/login`                  | Password login                        |
| POST   | `/api/auth/verify-login-otp`       | Verify the login OTP                  |
| POST   | `/api/auth/forgot-password`        | Start a password reset                |
| POST   | `/api/auth/verify-reset-otp`       | Verify the reset OTP                  |
| POST   | `/api/auth/reset-password`         | Set a new password                    |
| GET    | `/api/auth/me`                     | Current session user                  |
| POST   | `/api/auth/logout`                 | End the session                       |
| POST   | `/api/auth/request-delete-account` | Request account deletion              |
| DELETE | `/api/auth/account`                | Delete the account                    |

The frontend calls these with **relative** URLs (`/api/...`) and each form's
`data-endpoint` already points at the correct route, so the same build works against
both the local server and production with no markup changes.

---

## Deploying to Vercel

The whole Express app is deployed as a **single serverless function** (`api/index.js`),
so Helmet, CORS/CSRF, rate limiting, the blocked-path guard, static file serving and the
HTML 404 fallback all behave exactly as they do locally.

`vercel.json`:

- keeps `api/index.js` as the single serverless entry that wraps the Express app,
- bundles the generated site (HTML, `pages/`, `services/`, `assets/`, `images/`,
  `css/`, `js/`, `sitemap.xml`, `robots.txt`) with `functions.includeFiles` so the
  same Express code serves the site and the API locally and on Vercel,
- rewrites every request to the function with `rewrites`, so `/api/...` reaches
  Express (the original request path is preserved inside the function).

The front-end calls the API with relative URLs (`/api/...`), so it works from the
same Vercel domain with no extra configuration.

### Steps

1. Push this repository to GitHub.
2. In Vercel choose **New Project → Import** the repository. Use the **Other**
   framework preset. No build command or output directory is required — `vercel.json`
   handles everything.
3. Add the variables from `.env.example` under **Settings → Environment Variables**.
   For production also set:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-domain.com` (comma-separate multiple origins)
   - `TRUST_PROXY=true` (Vercel runs behind a proxy)

   The deployment's own Vercel hostnames are added to the allowed origins
   automatically (`VERCEL_URL`, `VERCEL_BRANCH_URL`, `VERCEL_PROJECT_PRODUCTION_URL`),
   so the site's own API calls are never blocked by the origin/CSRF checks.
4. In **MongoDB Atlas → Network Access**, allow access from Vercel
   (`0.0.0.0/0`, or use Atlas private networking).
5. Set `SITE.domain` in `tools/data.js`, run `node tools/build.js`, and commit so the
   canonical tags and `sitemap.xml` use the production domain.
6. Deploy, then open `/api/health` to confirm the function and database are reachable.

> **Secrets:** `.env` and `.vercel` are git-ignored. Never commit real credentials.

---

## Accessibility & SEO

- Semantic landmarks, a single `<h1>` per page, logical heading order.
- Skip link, visible focus styles, ARIA attributes on menus, accordions and tabs.
- Honours `prefers-reduced-motion` (scroll reveals and transitions are disabled).
- Targets WCAG 2.2 AA contrast and touch-target sizing where practical.
- Per-page `<title>`, meta description, Open Graph tags, breadcrumbs and a 404 page.
- Crawlable static output — no client-side routing required.
- `sitemap.xml` and `robots.txt` are generated automatically.

---

## Logo

The original artwork lives at `images/logo.png`. Optimised, resized versions used by the
site are in `assets/logo/`:

- `shanzoo-logo.png` — 720×478
- `shanzoo-logo-360.png` — 360×239

The logo has a white background, so it is displayed on the white header and inside a
white "pill" in the footer. Favicons and `site.webmanifest` live in `assets/icons/`.

---

## Browser support

Latest two versions of Chrome, Edge, Firefox and Safari. The CSS uses custom properties
and modern layout (grid/flex) and the JS targets evergreen browsers (ES5-compatible
syntax where it matters).

---

## Notes

- No analytics, trackers or third-party scripts are included.
- No client counts, awards or case studies are published, per the brief.
- Replace the placeholder content on **Privacy**, **Terms** and **404** pages before launch.

## Contributing

1. Edit sources (never generated HTML directly).
2. Run `node tools/build.js`.
3. Open the site locally and verify links, focus states and mobile layout.
