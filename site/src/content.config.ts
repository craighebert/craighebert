// Content collections: where content lives (loaders) and the rules it must follow (schemas).
// The schemas mirror docs/content-model.md. If a file breaks a rule, the build stops
// and says which file and field.
import { defineCollection, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parse as parseYaml } from 'yaml';

// All content lives outside the site, in the repo's /content folder.
const CONTENT = '../content';

// ---------- Small reusable rules ----------

// YAML turns ISO date-times into JS Dates; coerce also accepts quoted strings.
const dateTime = z.coerce.date();
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');
const mediaId = reference('media');

// Shared fields: every type except Settings (and Tag, which has its own short list).
const sharedFields = {
  id: z.string().min(1),
  slug,
  title: z.string().min(1),
  shortTitle: z.string().max(40).optional(),
  summary: z.string().min(1).max(200),
  status: z.enum(['draft', 'published']),
  visibility: z.enum(['public', 'private']),
  publishedAt: dateTime,
  updatedAt: dateTime.optional(),
  tags: z.array(reference('tags')).optional(),
  cover: mediaId.optional(),
};

const linkedin = z.strictObject({
  hook: z.string().optional(),
  text: z.string().max(3000).optional(),
  hashtags: z
    .array(z.string().regex(/^[^#\s]+$/, 'Write hashtags without # or spaces'))
    .min(3)
    .max(5)
    .optional(),
  linkPlacement: z.enum(['in-post', 'first-comment']).optional(),
});

const syndication = z.array(
  z.strictObject({
    platform: z.string(),
    url: z.url(),
    sharedAt: dateTime,
  }),
);

// Fields shared by Post and Project for LinkedIn sharing.
const sharingFields = {
  socialImage: mediaId.optional(),
  linkedin: linkedin.optional(),
  syndication: syndication.optional(),
};

// Use our own `id` field as the entry ID, so IDs never change even if a file
// is renamed or a slug changes. References (e.g. `project:`) point at these IDs.
const idFromData = ({ data }: { data: Record<string, unknown> }) => String(data.id);

// ---------- 1. Settings (one file) ----------
const settings = defineCollection({
  // The file holds a single object, so it becomes one entry with the ID "site".
  loader: file(`${CONTENT}/settings/settings.yaml`, {
    parser: (text) => [{ id: 'site', ...parseYaml(text) }],
  }),
  schema: z.strictObject({
    id: z.literal('site'),
    siteName: z.string().min(1),
    tagline: z.string().optional(),
    shortBio: z.string().optional(),
    longBio: z.string().optional(),
    profilePhoto: mediaId.optional(),
    // nullish: allows `social:` with every line commented out.
    social: z
      .strictObject({ linkedin: z.url().optional(), youtube: z.url().optional() })
      .nullish(),
    youtubeChannelId: z.string().optional(),
    contactEmail: z.email().optional(),
    defaultSocialImage: mediaId.optional(),
    navigation: z.array(z.strictObject({ label: z.string(), href: z.string() })).optional(),
    licence: z.string().optional(),
  }),
});

// ---------- 2. Post ----------
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT}/posts`, generateId: idFromData }),
  schema: z
    .strictObject({
      ...sharedFields,
      format: z.enum(['article', 'video', 'note']),
      video: mediaId.optional(),
      series: z.string().optional(),
      project: reference('projects').optional(),
      featured: z.boolean().optional(),
      related: z.array(z.string()).optional(),
      ...sharingFields,
    })
    .refine((post) => post.format !== 'video' || post.video, {
      message: 'A video post needs a `video` media ID',
      path: ['video'],
    }),
});

// ---------- 3. Media item ----------
const media = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml}', base: `${CONTENT}/media`, generateId: idFromData }),
  schema: z
    .strictObject({
      ...sharedFields,
      kind: z.enum(['image', 'video', 'audio']),
      host: z.enum(['r2', 'stream', 'youtube']),
      source: z.string().min(1),
      alt: z.string().optional(),
      caption: z.string().optional(),
      credit: z.string().optional(),
      licence: z.string().optional(),
      capturedAt: dateTime.optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      duration: z.number().nonnegative().optional(),
      focalPoint: z
        .strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
        .optional(),
      transcript: z.string().optional(),
      youtube: z
        .strictObject({
          title: z.string().optional(),
          description: z.string().optional(),
          thumbnail: z.string().optional(),
          chapters: z
            .array(z.strictObject({ at: z.number().nonnegative(), title: z.string() }))
            .optional(),
          publishedAt: dateTime.optional(),
        })
        .optional(),
      standalone: z.boolean().optional(),
    })
    .refine((m) => m.kind !== 'image' || m.alt, {
      message: 'Images need `alt` text',
      path: ['alt'],
    })
    .refine((m) => m.host !== 'youtube' || m.youtube, {
      message: 'YouTube media needs a `youtube` object',
      path: ['youtube'],
    }),
});

// ---------- 4. Project ----------
const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT}/projects`, generateId: idFromData }),
  schema: z.strictObject({
    ...sharedFields,
    stage: z.enum(['idea', 'building', 'shipped', 'paused', 'archived']),
    startedAt: z.coerce.date().optional(),
    shippedAt: z.coerce.date().optional(),
    role: z.string().optional(),
    collaborators: z
      .array(z.strictObject({ name: z.string(), url: z.url().optional() }))
      .optional(),
    stack: z.array(z.string()).optional(),
    links: z
      .array(
        z.strictObject({
          label: z.string(),
          url: z.url(),
          kind: z.enum(['repo', 'live', 'demo', 'docs', 'download', 'store']),
        }),
      )
      .optional(),
    media: z.array(mediaId).optional(),
    video: mediaId.optional(),
    featured: z.boolean().optional(),
    ...sharingFields,
  }),
});

// ---------- 5. Page ----------
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: `${CONTENT}/pages`, generateId: idFromData }),
  schema: z.strictObject({
    ...sharedFields,
    navOrder: z.number().int().optional(),
  }),
});

// ---------- 6. Tag ----------
const tags = defineCollection({
  loader: file(`${CONTENT}/tags/tags.yaml`),
  schema: z.strictObject({
    id: slug,
    label: z.string().min(1),
    description: z.string().optional(),
  }),
});

export const collections = { settings, posts, media, projects, pages, tags };
