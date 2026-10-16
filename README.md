# Scenora

> **Find your next favorite.**
> An editorial, cinematic movie discovery platform celebrating visual storytelling, curated cinema, and thoughtful film exploration.

Powered by SvelteKit, Svelte 5, Tailwind CSS, and the TMDB API v3.

---

## 1. Features Overview

- **Cinematic Homepage**:
  - Hero presentation showcasing high-resolution backdrops, key metadata, and responsive multi-stage legibility scrims.
  - Curated movie collections: Trending This Week, Now in Theaters, Popular & Acclaimed, Anticipated Releases.
  - Interactive "From Your Watchlist" and "Recently Viewed" dynamic carousels.
  - Thematic genre exploration tiles with custom icon badges.
- **Explore & Filter Catalog (`/explore`)**:
  - Filter movies by genre, release year, and minimum user rating.
  - Multiple sorting options: Most Popular, Highest Rated, Newest Releases, Oldest Releases.
  - URL query parameter synchronization with back/forward history support.
  - Fully responsive mobile drawer and desktop filter bar.
  - Accessible pagination bounded to TMDB API limits.
- **Instant Live Search (`/search`)**:
  - Debounced (300ms) real-time searching against the TMDB movie catalog.
  - AbortController cancellation for outdated in-flight requests.
  - Recent searches persisted locally with quick-retrigger and removal capabilities.
  - Popular search suggestion chips.
  - Crawl protection (`noindex, follow`) on active query result pages.
- **Movie Details (`/movie/[id]`)**:
  - Comprehensive film metadata: Director, Original Language, Budget, Box Office, Runtime, Status, Release Date.
  - Official YouTube trailers modal with keyboard focus trap, escape key support, and no-cookie domain.
  - Artwork gallery with categorized posters, backdrops, and logos.
  - Fullscreen lightbox preview with keyboard navigation (arrow keys, escape), image dimensions, aspect ratios, and direct link to original assets.
  - Cast headshot directory with expandable limits.
  - Role-classified key crew (Directors, Writers, Producers, Cinematographers, Composers, Editors, Production Designers).
  - Complete collapsible production crew directory grouped by department.
  - Deduplicated similar films and recommended movies.
- **Filmmaker & Cast Profiles (`/person/[id]`)**:
  - Biographical profile, place of birth, birthday/deathday, and calculated age.
  - Role-aware filmography categorized by Acting, Directing, Writing, Producing, Cinematography, and Crew.
- **Linked Metadata Discovery**:
  - Production company film catalogs (`/company/[id]`).
  - Country of origin discovery pages (`/country/[code]`).
  - Original language discovery pages (`/language/[code]`).
- **Private Personal Watchlist (`/watchlist`)**:
  - Client-side offline persistence powered by `localStorage`.
  - Zero hydration mismatch: SSR-safe initialization with skeleton placeholders.
  - Sorting by date added, rating, release year, or title.
  - Genre-based in-memory filtering.
  - Duplicate prevention and storage quota error handling.
- **Design & Accessibility**:
  - Custom design tokens: `#0B0D12` background, `#151922` surface, `#202632` elevated surface, `#B7F36B` accent.
  - Dark and light theme modes with inline script preventing theme flashes.
  - WCAG 2.2 AA compliant: Semantic HTML landmarks, skip-to-content navigation, visible focus indicators, screen reader labels, reduced-motion overrides.
- **Technical SEO & Sitemap**:
  - Unique titles, descriptions, canonical links, Open Graph, and Twitter Cards across all public routes.
  - Dynamic XML sitemap endpoint (`/sitemap.xml`) adapting to the host origin.
  - Standard `robots.txt` disallowing private and arbitrary query endpoints.

---

## 2. Technology Stack

- **Framework**: SvelteKit 3 (`@sveltejs/kit`)
- **UI Engine**: Svelte 5 (Runes reactivity: `$state`, `$derived`, `$effect`, `$props`)
- **Language**: TypeScript with strict type checking
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide Svelte (`lucide-svelte`)
- **Runtime & Package Manager**: Bun
- **Data Source**: TMDB API v3
- **Test Runner**: Bun Test (`bun test`)
- **Code Quality**: Prettier and ESLint

---

## 3. Prerequisites

- [Bun](https://bun.sh/) (v1.0.0 or later)
- TMDB API Read Access Token (v3/v4 Bearer token from [themoviedb.org](https://www.themoviedb.org/settings/api))

---

## 4. Getting Started

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/example/scenora.git
cd scenora

# Install dependencies using Bun
bun install
```

### 2. Configure Environment Variables

Copy the example environment template and add your TMDB API read access token:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# TMDB API Read Access Bearer Token (v3/v4)
# Kept server-side only; never exposed to browser bundles
TMDB_ACCESS_TOKEN=your_real_tmdb_read_access_token_here

# Application origin for canonical links and reverse proxy matching
ORIGIN=http://localhost:5173

# Server host and port
HOST=127.0.0.1
PORT=3000
```

> **Security Note**: Never prefix `TMDB_ACCESS_TOKEN` with `VITE_`. Tokens are loaded through private server environment variables and native fetch on the server, ensuring credentials never leak into client scripts, HTML, or source maps.

### 3. Development Server

Start the local development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Available Scripts

The project includes pre-configured scripts in `package.json`:

| Command           | Description                                                                          |
| :---------------- | :----------------------------------------------------------------------------------- |
| `bun run dev`     | Starts the Vite development server with hot module replacement (HMR).                |
| `bun run check`   | Runs SvelteKit synchronization and `svelte-check` for TypeScript/Svelte diagnostics. |
| `bun run test`    | Executes unit and integration test suites with Bun Test.                             |
| `bun run lint`    | Verifies code formatting with Prettier and checks rules with ESLint.                 |
| `bun run format`  | Automatically formats all source code using Prettier.                                |
| `bun run build`   | Compiles client assets and SSR routes for production deployment.                     |
| `bun run preview` | Starts a local production preview server.                                            |

---

## 6. Testing & Quality Verification

All test suites use mocked responses for deterministic execution without requiring external network connectivity or a live TMDB token:

```bash
# Run all tests
bun run test

# Run type checker
bun run check

# Check linting and formatting
bun run lint
```

---

## 7. Production Deployment (VPS)

### Build the Application

```bash
# Set production environment
NODE_ENV=production bun run build
```

### Deployment Architecture

In production, Scenora runs as a Node/Bun server behind a high-performance reverse proxy (Caddy or Nginx) that handles SSL/TLS termination, HTTP/2 or HTTP/3, and gzip/brotli compression.

#### A. Running with Systemd

Create a systemd unit file at `/etc/systemd/system/scenora.service`:

```ini
[Unit]
Description=Scenora Movie Discovery Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/scenora
EnvironmentFile=/var/www/scenora/.env
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=127.0.0.1
ExecStart=/usr/local/bin/bun run preview --host 127.0.0.1 --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now scenora
sudo systemctl status scenora
```

#### B. Reverse Proxy Configuration: Caddy

Caddy provides automatic HTTPS with Let's Encrypt and HTTP/3 support:

```caddy
scenora.example.com {
    # Reverse proxy upstream to local application
    reverse_proxy 127.0.0.1:3000 {
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # Enable compression
    encode gzip zstd

    # Security Headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "DENY"
        Referrer-Policy "strict-origin-when-cross-origin"
        Permissions-Policy "camera=(), microphone=(), geolocation=()"
    }
}
```

#### C. Reverse Proxy Configuration: Nginx

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name scenora.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name scenora.example.com;

    ssl_certificate /etc/letsencrypt/live/scenora.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scenora.example.com/privkey.pem;

    # Immutable client static asset caching
    location /_app/immutable/ {
        alias /var/www/scenora/.svelte-kit/output/client/_app/immutable/;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Upstream application proxy
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

---

## 8. TMDB Attribution & Compliance

This product uses the TMDB API but is not endorsed or certified by TMDB.

- TMDB Logo and attribution are integrated in the application footer in compliance with TMDB API terms.
- Movie posters, backdrops, logos, and cast photography are served directly from the official TMDB CDN (`https://image.tmdb.org/t/p/`).
- Full terms of use: [https://www.themoviedb.org/documentation/api/terms-of-use](https://www.themoviedb.org/documentation/api/terms-of-use)

---

## 9. Known Limitations

- **Search bounds**: TMDB API caps paginated search and discover requests at 500 pages maximum.
- **Client storage**: The watchlist operates purely via browser `localStorage` without a remote user account database. Browsing in private windows or clearing browser data will clear saved titles.
- **Rate limiting**: TMDB API enforces application rate limits. The application implements in-memory TTL caching (5 minutes for movie lists, 24 hours for genres) to prevent excessive upstream queries.
