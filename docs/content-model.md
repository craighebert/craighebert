# Content Model v0.3 (draft)

Site purpose: personal portfolio + creative media channel.
Main activity: **blogging and YouTube videos**, shared to **LinkedIn** with links back to the site.
Heads now: website + LinkedIn sharing. The model stays headless so newsletter, screens, apps and other social platforms can be added later without restructuring.

## Publishing pattern: POSSE
"Publish on your Own Site, Syndicate Elsewhere."
1. The full post lives on your site (you own it, it's permanent, it's the canonical URL).
2. LinkedIn gets a native post written for LinkedIn, linking back.
3. YouTube hosts public videos; your site embeds them and adds the write-up, transcript and context.
4. The site records where each post was shared, so everything links together.

## Principles
- Media files live in R2/Stream or on YouTube. Content files only reference them by **media ID**. One media record is reused everywhere.
- Content stores meaning, not layout.
- Every item has short-form fields for cards, feeds, social and future heads.
- Private items never appear in the public site or public API.

## Shared fields (every type except Settings)
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | text | yes | Stable, never changes |
| `slug` | text | yes | URL part |
| `title` | text | yes | |
| `shortTitle` | text | no | ≤ 40 chars |
| `summary` | text | yes | 1–2 sentences, ≤ 200 chars; also the meta description |
| `status` | draft / published | yes | Drafts only show on staging |
| `visibility` | public / private | yes | |
| `publishedAt` | date-time | yes | ISO with time zone |
| `updatedAt` | date-time | no | |
| `tags` | list of tag IDs | no | |
| `cover` | media ID | no | Main image/thumbnail |

## Types (build order)

### 1. Settings (one file)
Site name, tagline, short bio, long bio, profile photo, social links (LinkedIn, YouTube channel), YouTube channel ID, contact email, default social image, navigation, licence.

### 2. Post (primary type)
Blog writing and video posts.
| Field | Type | Required | Notes |
|---|---|---|---|
| `body` | Markdown | yes | |
| `format` | article / video / note | yes | `video` = built around a YouTube video |
| `video` | media ID | if format=video | Shown at the top of the post |
| `series` | text | no | |
| `project` | project ID | no | Adds this post to that project's build log |
| `featured` | yes/no | no | |
| `socialImage` | media ID | no | 1200×627 (1.91:1) for LinkedIn link previews; falls back to cover |
| `linkedin` | object | no | See below |
| `syndication` | list | no | Where it was shared: `{ platform, url, sharedAt }` |
| `related` | list of IDs | no | |

`linkedin` object:
| Field | Notes |
|---|---|
| `hook` | First ~200 characters; what shows before "see more" |
| `text` | Full LinkedIn post text (LinkedIn limit is about 3,000 chars) |
| `hashtags` | 3–5 |
| `linkPlacement` | in-post / first-comment |

### 3. Media item
| Field | Type | Required | Notes |
|---|---|---|---|
| `kind` | image / video / audio | yes | |
| `host` | r2 / stream / youtube | yes | |
| `source` | R2 key, Stream ID or YouTube video ID | yes | |
| `alt` | text | images: yes | |
| `caption`, `credit`, `licence` | text | no | |
| `capturedAt` | date-time | no | |
| `width` / `height` / `duration` | number | auto | |
| `focalPoint` | x,y (0–1) | no | Safe cropping for 16:9, 9:16, 1:1, 1.91:1 |
| `transcript` | Markdown | video/audio: recommended | From YouTube captions; good for search and accessibility |
| `youtube` | object | if host=youtube | `title`, `description`, `thumbnail`, `chapters`, `publishedAt` |
| `standalone` | yes/no | no | Own page at `/watch/<slug>` |

Hosting rule of thumb: public videos → YouTube (reach, free). Private or members-only videos → Cloudflare Stream. Photos → R2.

### 4. Project (things you build)
A project has its own page and gathers everything about it: write-up, build-log posts, videos, images and links.
| Field | Type | Required | Notes |
|---|---|---|---|
| `body` | Markdown | yes | What it is, why, how it works, lessons learned |
| `stage` | idea / building / shipped / paused / archived | yes | Shown as a badge |
| `startedAt` / `shippedAt` | date | no | |
| `role` | text | no | What you did |
| `collaborators` | list | no | Name + optional link |
| `stack` | list of text | no | Tools, languages, materials, hardware |
| `links` | list | no | `{ label, url, kind }`: kind = repo / live / demo / docs / download / store |
| `media` | ordered list of media IDs | no | Screenshots, photos, demo videos (YouTube) |
| `video` | media ID | no | Main demo/overview video |
| `featured` | yes/no | no | Shown on the home page |
| `socialImage`, `linkedin`, `syndication` | | no | Same as Post, for launch announcements |

Posts link to a project with `project: <project-id>`. The project page then shows a **build log**: every related post and video in date order. Milestone posts ("v1 shipped") are natural LinkedIn shares.

### 5. Page
About, Contact, Uses, Now. `body` (Markdown), `navOrder`.

### 6. Tag
`id`, `label`, `description`.

### Later (kept in the model, not built first)
- Gallery: ordered media IDs, `layoutHint`, `location`, intro.

## Embedding media inside Markdown
`::media{id="yt-2026-11-workflow-tour"}`
Website renders a fast, privacy-friendly YouTube player (youtube-nocookie, loads only on click). Other heads read the same ID from the API.

## LinkedIn sharing (how the website supports it)
- Every post page has Open Graph tags (title, summary, social image, canonical URL) so LinkedIn shows a proper preview card.
- Links shared to LinkedIn carry tracking tags (`?utm_source=linkedin&utm_medium=social&utm_campaign=<slug>`) so you can see which posts bring visitors.
- Staging shows a "LinkedIn draft" panel per post: hook, text, hashtags and the link, ready to copy from the phone.
- Claude can draft the `linkedin` fields from the post body.
- After sharing, add the LinkedIn post URL to `syndication` (from the phone CMS); the site can then show "Discuss on LinkedIn".
- Use LinkedIn's Post Inspector to refresh the preview if an image or title changes.
- Commonly reported: LinkedIn may show posts with external links to fewer people, so many creators put the link in the first comment. `linkPlacement` lets you choose per post.
- Later: automated posting from the RSS feed via a scheduler (e.g. Buffer) or LinkedIn's API.

## YouTube integration
- Store your channel ID in Settings.
- Later: a scheduled job reads your channel's public video feed and creates draft video posts + media items automatically, ready for you to add the write-up.
- Video posts include the transcript below the player (good for search and accessibility) and chapters if the video has them.

## Files in the repo
```
content/
  settings.yaml
  tags.yaml
  pages/about.md
  posts/2026-11-first-post.md
  media/yt-2026-11-workflow-tour.yaml
  media/img-2026-11-cover.yaml
```

## Example video post
```markdown
---
id: post-2026-11-workflow-tour
slug: workflow-tour
title: "How I edit my website from my phone"
summary: "A walkthrough of my phone-first publishing setup."
status: published
visibility: public
publishedAt: 2026-11-10T09:00:00-06:00
format: video
video: yt-2026-11-workflow-tour
cover: img-2026-11-cover
tags: [workflow, web]
linkedin:
  hook: "I rebuilt my website so I can publish from my phone. Here's how it works."
  text: |
    I rebuilt my website so I can publish from my phone...
  hashtags: [webdev, creators, productivity]
  linkPlacement: first-comment
syndication:
  - platform: linkedin
    url: https://www.linkedin.com/feed/update/urn:li:activity:...
    sharedAt: 2026-11-10T09:15:00-06:00
---
Here's the full write-up...
```

## Example YouTube media item
```yaml
id: yt-2026-11-workflow-tour
slug: workflow-tour-video
title: "Phone-first website workflow"
kind: video
host: youtube
source: dQw4w9WgXcQ   # your YouTube video ID
status: published
visibility: public
publishedAt: 2026-11-10T09:00:00-06:00
duration: 612
youtube:
  chapters:
    - { at: 0, title: "Intro" }
    - { at: 95, title: "Editing on the phone" }
transcript: |
  ...
```

## Website URLs
`/` · `/posts/` · `/posts/<slug>` · `/videos/` (posts with format=video) · `/projects/` · `/projects/<slug>` (with build log) · `/watch/<slug>` · `/tags/<tag>` · `/about` · later `/galleries/`

## Content API and feeds
`/api/v1/settings.json` · `/api/v1/posts.json` · `/api/v1/posts/<slug>.json` · same for `projects`, `media`, `pages`, `tags`. Project JSON includes its build log.
Feeds: `/rss.xml`, `/feed.json`, `/sitemap.xml`. The RSS feed is also what a LinkedIn scheduler would read later.

## Open questions
- Default licence (all rights reserved vs Creative Commons)?
- Audio as a podcast feed later?
