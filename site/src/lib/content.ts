// Helpers every page uses to read content. The visibility rule lives here, in one place.
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

/**
 * Drafts are shown only when BOTH are true:
 * 1. PUBLIC_SHOW_DRAFTS is "true" (from the environment or site/.env.<mode>, see
 *    `npm run build:staging`). Spaces and capitals are ignored.
 * 2. This is not a build of the `main` branch. Cloudflare Pages sets CF_PAGES_BRANCH on
 *    every build, so production can never show drafts, whatever the variable says.
 *    Locally CF_PAGES_BRANCH is unset, so only the variable matters.
 * Both are read at build time; this code never runs in the visitor's browser.
 */
const rawShowDrafts = import.meta.env.PUBLIC_SHOW_DRAFTS;
const branch = process.env.CF_PAGES_BRANCH;
const wantsDrafts = String(rawShowDrafts ?? '').trim().toLowerCase() === 'true';
const isMainBranch = branch?.trim() === 'main';
export const SHOW_DRAFTS = wantsDrafts && !isMainBranch;

// Printed in the build log (and dev terminal) so you can see what the build actually saw.
console.info(
  `[content] Drafts ${SHOW_DRAFTS ? 'SHOWN' : 'hidden'} ` +
    `(PUBLIC_SHOW_DRAFTS=${JSON.stringify(rawShowDrafts)}, CF_PAGES_BRANCH=${JSON.stringify(branch)})` +
    (wantsDrafts && isMainBranch ? ' — blocked: drafts never show on main' : ''),
);

type Publishable = {
  data: { status: 'draft' | 'published'; visibility: 'public' | 'private'; publishedAt: Date };
};

/**
 * Should this item appear on the site?
 * - Private items: never.
 * - Staging (SHOW_DRAFTS): drafts and scheduled (future-dated) items too.
 * - Production: only published items whose publish date has passed.
 *   Note: the site is static, so a scheduled item appears on the first build after its date.
 */
export function isVisible(entry: Publishable): boolean {
  const { status, visibility, publishedAt } = entry.data;
  if (visibility !== 'public') return false;
  if (SHOW_DRAFTS) return true;
  return status === 'published' && publishedAt.getTime() <= Date.now();
}

const newestFirst = (a: Publishable, b: Publishable) =>
  b.data.publishedAt.getTime() - a.data.publishedAt.getTime();

/** Fails the build if two visible items would get the same URL. */
function assertUniqueSlugs(collection: string, entries: { data: { slug: string } }[]) {
  const seen = new Set<string>();
  for (const { data } of entries) {
    if (seen.has(data.slug)) throw new Error(`Duplicate slug "${data.slug}" in ${collection}`);
    seen.add(data.slug);
  }
}

async function getVisible<C extends 'posts' | 'projects' | 'pages'>(collection: C) {
  const entries = (await getCollection(collection, isVisible)) as CollectionEntry<C>[];
  assertUniqueSlugs(collection, entries);
  return entries.sort(newestFirst);
}

export const getPosts = () => getVisible('posts');
export const getProjects = () => getVisible('projects');

/** Pages, ordered for navigation (pages without navOrder go last). */
export async function getPages() {
  const pages = await getVisible('pages');
  return pages.sort((a, b) => (a.data.navOrder ?? Infinity) - (b.data.navOrder ?? Infinity));
}

export async function getSettings() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Missing content/settings/settings.yaml');
  return entry.data;
}

/** Looks up a referenced media item; returns undefined if it is hidden (private, or a draft in production). */
export async function getMedia(ref: { id: string } | undefined) {
  if (!ref) return undefined;
  const item = await getEntry('media', ref.id);
  return item && isVisible(item) ? item : undefined;
}

/** True if the entry's `tags` list includes this tag ID. */
export const hasTag = (entry: { data: { tags?: { id: string }[] } }, tagId: string) =>
  entry.data.tags?.some((t) => t.id === tagId) ?? false;

/** Date-times (publishedAt etc.) are shown in the site's home time zone. */
export const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'America/Winnipeg' }).format(
    date,
  );

/**
 * Date-only fields (startedAt, shippedAt) are stored as midnight UTC, so format them in UTC.
 * Otherwise 2026-11-08 would show as Nov 7 in Winnipeg.
 */
export const formatDay = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
