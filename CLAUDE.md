# CLAUDE.md

House rules for any Claude working on this repo.

## What this is

A headless personal site (portfolio + creative media channel).

- `/content`: the content, as Markdown and YAML. It must follow [docs/content-model.md](docs/content-model.md).
- `/site`: the Astro website that displays it. The schemas in `site/src/content.config.ts`
  mirror the content model; change both together if the model changes.
- `/docs`: the plans. Read [docs/website-plan.md](docs/website-plan.md) for the bigger picture.

## Git workflow

- **Never commit to `main`.** `main` is production; it only changes by promoting `staging`.
- Start work from an up-to-date `staging` branch:
  `git switch staging && git pull`
- Make a new branch named `claude/<short-description>`, e.g. `claude/add-uses-page`.
- Open pull requests into **`staging`**, never into `main`.

## Before opening a pull request

Content must match the schemas. From `/site`, run:

```sh
npm install        # first time only
npm run build      # type-check + build; this is what Cloudflare runs
```

Fix every error before opening the pull request. Errors name the file and field
(e.g. a missing field, a typo in a field name, an unknown tag or media ID).
To check drafts render too, also run `npm run build:staging`.

## Content rules

- An item's `id` never changes once created; other content refers to it by ID.
- Dates are ISO with time zone, America/Winnipeg (e.g. `2026-11-10T09:00:00-06:00`).
- Media files never go in the repo. Content only refers to media by media ID; the files live
  in R2, Cloudflare Stream or YouTube.
- Drafts (`status: draft`) show only on staging builds; they never appear on `main`.
  `visibility: private` items never appear anywhere. Don't weaken these rules in `site/src/lib/content.ts`.

## Never commit secrets or private material

**The repo is public.** Never add secrets, API keys, tokens, passwords, private email
addresses or private media. Secrets belong in Cloudflare's environment settings or a
git-ignored `.env` file. Only `site/.env.staging` is committed, and it holds public flags only.

## Keep changes small

- One purpose per pull request.
- Explain the change in the pull request description in plain language: what changed,
  why, and how it was checked. Craig is learning, so avoid unexplained jargon.
