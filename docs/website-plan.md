# Website Plan: headless, PHP-free, phone-editable

## Decisions log
- Architecture: headless. Content is stored as structured data, separate from any presentation. The website is one "head"; feeds, screens, apps and other channels are others.
- Content source of truth: plain files (Markdown + JSON/YAML with schemas) in a GitHub repo. Portable, versioned, Claude-friendly, no database or vendor lock-in.
- Delivery: Cloudflare (Pages builds the website AND a static JSON content API + feeds; a Worker API is added later for anything dynamic or private).
- Domain: Option A. Keep it registered at Hostinger; switch nameservers to Cloudflare only at launch.
- The new site, API and staging are built and tested BEFORE the nameservers move.
- Staging is promoted to production by merging `staging` into `main`.
- Media on storage Craig controls (Cloudflare R2, public + private buckets from day one). Planned in a separate chat.
- Repo: public GitHub repo `craighebert` (public so `main` can be protected on the free plan). Cloudflare Pages project `craighebert` → `craighebert.pages.dev`, staging `staging.craighebert.pages.dev`. Secrets and private content never go in the repo.
- Private drafting happens OUTSIDE GitHub (decided 2026-11-08). The repo stays public and only receives finished pieces. See "Drafting workflow" below.
- Step 0 DONE (2026-11-08): Google secured, password manager, GitHub (2FA, private email), Cloudflare (password set via reset, 2FA), VS Code signed in to GitHub with Astro + Claude Code extensions, Git identity set with GitHub noreply email.
- Site purpose: personal portfolio + creative media channel (posts, galleries, video, audio). Mostly blogging + YouTube videos, shared to LinkedIn with links back (POSSE pattern). Heads now: website + LinkedIn sharing. Public video on YouTube; private video on Cloudflare Stream. Content model draft: `claude/content-model.md`.
- Old WordPress site: nothing worth keeping. No content backup or migration. Only record the domain's DNS records and email settings before cutover. New content is written from scratch into the content model.

## 0. Accounts and security foundation
- Password manager (e.g. Bitwarden, 1Password or Google Password Manager) and an authenticator/passkeys on the phone.
- GitHub (free): passkey + 2FA, save recovery codes. Install the GitHub mobile app.
- Cloudflare (free): passkey/2FA, save recovery codes. Do NOT add the domain yet.
- Claude paid plan if not already (needed for Claude Code in VS Code, web and phone).
- VS Code on the desktop with Git installed.
- Store all recovery codes offline/in the password manager. Use one email (Gmail) for all accounts.

## 1. Content model (designed from scratch)
- Define the site's purpose, audiences and the content types it needs, then the fields for each type.
- Starter types to confirm or cut: page, post, event, media item, gallery, person/profile, announcement, screen playlist.
- Output: a written content model (types, fields, required/optional, which heads use each field) that becomes the schemas in step 3.

## 2. Headless architecture

### How headless works (and why)
- Traditional CMS (WordPress): content, database and page templates are welded together; content mostly comes out as web pages.
- Headless: the "body" (content + media) is separate from the "heads" (anything that displays it). Content is published once as clean data (JSON) and any screen or channel pulls what it needs.
- Purpose: one source of truth, many outputs (web, phones, TVs, signage, kiosks, email, feeds, social, voice, apps not yet invented); redesigns without touching content; stronger security (the editing side is never public); future-proofing.

### Layers
1. Editing: VS Code, Claude (desktop and phone), phone CMS. All write to Git.
2. Content hub: GitHub repo `/content` with schemas; media in R2 (+ Stream for video).
3. Delivery (Cloudflare):
   - Website (Astro, static HTML, installable PWA, works offline).
   - Static content API: versioned JSON generated at build, e.g. `/api/v1/posts.json`, `/api/v1/posts/<slug>.json`, `/api/v1/pages/...`, `/api/v1/screens/<screen-id>.json`.
   - Feeds: RSS/Atom, JSON Feed, sitemap, podcast RSS, iCal (events), oEmbed.
   - Later: Worker API at `api.yourdomain` for search, private content (Access/API keys), real-time items (KV/D1), webhooks.
4. Heads: website; feeds/email newsletter/podcast apps; screens (smart TVs, signage players, kiosks, Raspberry Pi, Chromecast); mobile apps; social cross-posting (Bluesky/Mastodon); voice/AI assistants.

### Content modelling rules
- Content types with schemas (validated at build).
- Every item: stable ID, slug, title, summary, publish date, status (draft/published), visibility (public/private), tags, canonical URL.
- Store meaning, not layout: no colours, columns or HTML styling inside content. Heads decide how it looks.
- Short-form fields alongside the body (summary, short title, call to action) so small screens, notifications and voice can use them.
- Media fields carry alt text, caption, credit, transcript/captions for audio/video, and focal point.
- Media renditions for every screen: responsive image sizes, crops for 16:9 (TV/landscape), 9:16 (vertical/phone/stories), 1:1; adaptive video (HLS via Stream) for any bandwidth.
- Dates in ISO format with time zone (America/Winnipeg).

### Transmission
- HTTPS everywhere via Cloudflare edge (fast globally, low bandwidth friendly).
- Pull: browsers, apps and screens fetch JSON/feeds; screens poll their playlist or cache it for offline playback.
- Push (later): webhooks on publish → newsletter send, social posts, push notifications, screen refresh.
- Offline: PWA caching for the website; signage players cache playlists and media.

### API rules
- Versioned paths (`/api/v1/`); never break a published version.
- Public API is read-only. Private content never appears in static JSON; it is served only by the Worker behind Access or API keys.
- CORS allowed for your own heads; caching headers set; rate limiting on the Worker.
- Staging has its own API (`staging.<project>.pages.dev/api/v1/`) so new heads can be tested before production.
- Tradeoff: static API updates after each build (~1–2 minutes). Anything needing instant updates goes through the Worker + KV later.

## 3. Repo, staging and promotion
- Repo layout:
  - `/content` — structured content + schemas (the body)
  - `/site` — Astro website + static API + feeds (first head and delivery)
  - `/heads` — future heads (e.g. signage player)
  - `/workers` — future Worker API
- Cloudflare Pages: production `<project>.pages.dev` (from `main`); staging `staging.<project>.pages.dev` (from `staging`); preview link for every other branch. Optional `beta.yourdomain` via one CNAME at Hostinger.
- Staging and previews behind Cloudflare Access.
- Flow: branch → preview → PR into `staging` → check → PR `staging` → `main` (promotion). One-click rollback in Cloudflare Pages.
- Protect `main` (PRs only), Dependabot, schema validation and link checks run on every PR (GitHub Actions).

## Drafting workflow (private, outside GitHub)
- Drafts live in Google Drive: `Website/Drafts`, `Website/Ready`, `Website/Published`. Write in Google Docs on phone or desktop.
- A "Post template" Google Doc holds the content-model fields at the top (title, summary, format, project, tags, YouTube link, cover image, LinkedIn hook/text), body below.
- Draft images/video stay in the Drive folder (or the private R2 bucket) until publishing.
- Claude can help write and edit drafts in Drive (Drive is connected to Claude).
- When ready: move the doc to `Ready`; Claude converts it to a Markdown post (front matter + body + media records) and opens a branch + pull request. From this point the content is public on GitHub.
- Check the preview / staging link → promote to `main` → share on LinkedIn → add the LinkedIn URL to `syndication` → move the doc to `Published`.
- In the repo, `status: draft` is rarely needed; it remains for unpublishing or holding a finished piece. Scheduled posts (future `publishedAt`) are hidden on the site until their date but visible on GitHub.
- Staging/preview login (Cloudflare Access) is optional now, since nothing private reaches the repo; still useful to hide unfinished design work.
- Phone CMS role: quick fixes, adding syndication links, small notes. Long-form drafting happens in Google Docs.

## 4. Editing workflow
- Desktop: VS Code + Astro + Claude Code extensions; `npm run dev`.
- Phone CMS (Pages CMS / Sveltia) mapped to the content schemas; saves to `staging`.
- Claude (web/phone): branch + PR; review preview; merge. Optional `@claude` in GitHub comments.
- GitHub mobile app: approve PRs, including promotions.

## 5. Media and launch
- Media details in the separate media chat (R2 public/private buckets, Stream, phone upload page, backups).
- Launch checklist:
  1. Staging approved and promoted; production site and API checked.
  2. Mobile, TV-size and accessibility checks; feeds validated.
  3. Record existing DNS records and email settings in hPanel; add domain to Cloudflare and copy all records (email especially).
  4. Switch nameservers at Hostinger; attach domain to Pages production (`yourdomain`, `api.` later).
  5. Monitor a week.
  6. Cancel Hostinger hosting (keep domain registration).

## Order of work
0. Accounts and security (password manager, GitHub, Cloudflare, Claude, VS Code).
1. Design the content model from scratch (types + fields).
2. Create the repo with the layout above; connect Cloudflare Pages; `staging` branch; protect `main`; Access on staging.
3. Build schemas, the static API and feeds first, then the website head on top of them.
4. Write starter content into the model.
5. Phone CMS and Claude workflow against `staging`.
6. Media (separate chat).
7. Launch.
8. Later: Worker API, additional heads (signage/TV, newsletter, social), push/webhooks.

## Learning path
1. Password manager, passkeys, 2FA.
2. Git and GitHub basics (commit, branch, pull request).
3. Markdown, YAML and JSON; what a schema is.
4. Headless concepts: content modelling, APIs, feeds.
5. Astro: content collections, layouts, components, endpoints (JSON).
6. Cloudflare Pages: deploys, previews, staging, rollback, Access.
7. Phone CMS and Claude workflow.
8. Later: Workers, KV/D1, R2.
