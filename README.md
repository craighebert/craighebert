# craighebert

My personal website: a portfolio and creative media channel (posts, YouTube videos, projects).

It's **headless**: content lives as plain files in `/content`, separate from any design.
The website in `/site` is the first "head" that displays it. Others (feeds, a JSON API,
LinkedIn sharing) read the same content.

- Content model: [docs/content-model.md](docs/content-model.md)
- Overall plan: [docs/website-plan.md](docs/website-plan.md)

## Layout

```
content/            The content (the "body"). Markdown + YAML.
  settings/         settings.yaml: site name, bio, navigation, licence
  tags/             tags.yaml: every tag (id, label, description)
  pages/            About, Contact, Uses, Now…      → /<slug>/
  posts/            Articles, video posts, notes    → /posts/<slug>/
  projects/         Things I build + build logs     → /projects/<slug>/
  media/            One YAML record per image/video (files live in R2 or YouTube)
site/               Astro website (static HTML)
  src/content.config.ts   Schemas: the rules every content file must follow
  src/lib/content.ts      Shared helpers, including the draft/private visibility rule
  src/pages/              One file per URL
docs/               Planning documents
```

## Run it locally

Requires Node 26 (see `.nvmrc`).

```sh
cd site
npm install
npm run dev              # production view, http://localhost:4321, live reload
npm run dev:staging      # staging view: drafts and scheduled items shown
npm run build            # type-check + build static HTML into site/dist/
npm run build:staging    # same, as staging
npm run preview          # serve the built site
```

## Drafts, scheduled and private items

Every item has `status` (draft / published), `visibility` (public / private) and `publishedAt`.

| | Production | Staging (`PUBLIC_SHOW_DRAFTS=true`) |
|---|---|---|
| published, public, date passed | shown | shown |
| draft | hidden | shown, marked "Draft" |
| future `publishedAt` | hidden until the next build after that date | shown, marked "Scheduled" |
| private | **never** | **never** |

The switch is read **at build time**. Every build prints which way it went:

```
[content] Drafts SHOWN (PUBLIC_SHOW_DRAFTS="true")
```

Ways to turn it on:

- **Locally:** `npm run dev:staging` / `npm run build:staging`. These load `site/.env.staging`
  and work in any terminal.
- **Cloudflare Pages:** Settings → Variables and Secrets → **Preview** environment
  (the `staging` branch is a preview deployment, not production) →
  `PUBLIC_SHOW_DRAFTS` = `true`. Variables only apply to *new* builds, so redeploy afterwards.
- **By hand in PowerShell:** `$env:PUBLIC_SHOW_DRAFTS = 'true'`
  (not `set PUBLIC_SHOW_DRAFTS true`, which creates a PowerShell variable Astro can't see).

## Adding content

1. Copy an existing file in the right `content/` folder.
2. Give it a new, unique `id` (never change it later) and `slug` (the URL part).
3. Run `npm run dev` or `npm run build`. If anything breaks a rule in the schema
   (missing field, typo in a field name, unknown tag or media ID), the build stops and
   tells you which file and field.
