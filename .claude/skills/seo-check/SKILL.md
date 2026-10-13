---
name: seo-check
description: Check rendered LocalWP pages against on-page SEO rules - title, meta description, canonical, indexing, headings, image alt text, links, Open Graph, structured data, robots.txt, and sitemap - and report each problem with where to fix it, without editing code. Asks whether to check all pages, a post type, or specific pages. Use for /seo-check [all | <url or slug> ... | <post-type>], SEO review, or pre-launch SEO checks.
---

# seo-check - on-page SEO review

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

Read-only. It reports problems and where to fix them; `/fix` or `/implement`
fixes theme code, and the user fixes content in wp-admin. It never edits theme
files, content, or settings.

It checks what search engines read in the rendered HTML. It does not measure
rankings, keywords, backlinks, or page speed; for speed, recommend PageSpeed
Insights on the live site.

## Input

- `/seo-check` - ask which pages to check (Step 1)
- `/seo-check all` - every published URL
- `/seo-check <post-type>` - every URL of one post type, for example `project`
- `/seo-check <url or slug> [...]` - specific pages: full URLs, paths such as
  `/about/`, or slugs such as `about` (resolved against the local URL)

## Prerequisites

- Local URL from `blueprint/context/coding-standards.md` (set by `/onboard`).
  If it is still `http://<site>.local`, ask for the URL.
- The LocalWP site is running. If the home page does not load, ask the user to
  start the site in LocalWP.
- Node.js 18+ for the helper:
  `node .claude/skills/seo-check/scripts/seo.mjs` (no dependencies, GET and HEAD
  requests only).

## Step 1 - choose the pages

When no argument was given, ask one question (use the question tool when
available):

**Which pages should I check?**

1. **All published pages** - every URL in the sitemap
2. **Specific pages** - you give one or more URLs or slugs
3. **One post type** - for example all projects

For specific pages, ask for the URLs or slugs in the same turn. For a post type,
run `pages` first and offer the types it found.

Then list the URLs:

```bash
node .claude/skills/seo-check/scripts/seo.mjs pages <local-url> [--type <slug>]
```

It reads the sitemap from `robots.txt` or `wp-sitemap.xml`. When "Discourage
search engines" is on (common in LocalWP), core sitemaps are off, so it falls
back to the REST API. If there are more than 50 URLs, show the counts per type
and ask whether to check them all, one type, or a sample (every page plus up to
5 of each other post type).

## Step 2 - site-wide checks

```bash
node .claude/skills/seo-check/scripts/seo.mjs site <local-url>
```

This reports robots.txt, the sitemap, search visibility, plain permalinks, and
any active SEO plugin (Yoast SEO, Rank Math, The SEO Framework, All in One SEO).

Search visibility: a `noindex` home page or `Disallow: /` usually means
**Settings > Reading > Discourage search engines** is on. On a local site that
is often intentional. Report it as a **launch blocker**, not as a local error,
and say it must be off on the live site.

## Step 3 - page checks

```bash
node .claude/skills/seo-check/scripts/seo.mjs check <url> [<url> ...] --links
```

Pass every chosen URL in one call: duplicate titles and descriptions are found
only across the pages of the same call. `--links` also checks the status of the
internal links found on those pages (up to 200). Each finding has a severity:

| Severity | Checks |
| --- | --- |
| error | HTTP status, missing or multiple `<title>`, `noindex`, missing `<html lang>` or viewport, missing, multiple, or empty `h1`, image without `alt`, multiple canonicals, invalid JSON-LD, broken internal link |
| warning | title outside 30-60 characters, missing meta description or outside 70-160, missing or foreign canonical, `nofollow`, skipped heading level, missing Open Graph tags, image without `width`/`height`, lazy-loaded first image, `href="#"` or empty links, links without text, redirects, duplicate titles or descriptions across pages |
| info | empty `alt` (correct only for decorative images), no structured data, no Twitter card, no site icon, internal `nofollow` |

The project rules make some of these stricter than generic SEO advice: one `h1`
per page, `alt` from the Media Library, and an eager, high-priority hero image
(`coding-standards.md`, Accessibility and Images and media).

## Step 4 - find where each problem comes from

Read the theme, without editing, to say where each problem is fixed:

| Problem | Usually fixed in |
| --- | --- |
| `<title>` missing or duplicated | `add_theme_support( 'title-tag' )` in `inc/setup.php`; no hard-coded `<title>` in `header.php` |
| `lang`, viewport, head tags missing | `header.php`: `language_attributes()`, viewport meta, `wp_head()` |
| No `h1` or several | the section template parts in `template-parts/sections/`; two layouts that both output `h1` on one page; `/section` gives the `h1` only to the first section when the design says so |
| Image `alt` missing | a hard-coded `<img>` in a template (use `wp_get_attachment_image`), or empty alt text in the **Media Library** |
| Image size attributes, lazy hero | the template's `wp_get_attachment_image` call and its `$attrs` |
| Placeholder links | an empty ACF link field (content) or a template that prints `#` |
| Page title text, duplicate titles | the page title in wp-admin, or the SEO plugin's title field |
| Meta description, Open Graph, structured data | the SEO plugin's fields. WordPress core does not output these |

If there is **no SEO plugin**, do not pick a fix for missing descriptions, Open
Graph, or structured data. Present the choice, because it changes content
structure:

1. Install an SEO plugin (Yoast SEO, Rank Math, or The SEO Framework) -
   simplest, editors manage fields per page
2. Theme fields - an ACF "SEO" group plus a small `wp_head` output in
   `inc/seo.php`, built later through `/feature` or `/fix`

With an SEO plugin active, missing fields are content work in wp-admin, not
theme bugs.

## Report

Start with one summary table, one row per page:

| Page | Errors | Warnings | Info | Verdict |
| --- | --- | --- | --- | --- |
| `/` | 0 | 2 | 1 | pass with warnings |
| `/about/` | 1 | 0 | 0 | fail (1 error) |

Then the **site-wide** findings, including launch blockers. Then one table per
page that has errors or warnings:

| Severity | Check | Found | Expected | Fix in |
| --- | --- | --- | --- | --- |
| error | h1-multiple | "Our work", "Contact" | Exactly one h1 | `template-parts/sections/contact.php` |
| warning | meta-description | Missing | 70-160 characters | Yoast SEO field (wp-admin) |

Then list duplicates across pages and broken links with the pages that contain
them. Finish with **Fix first**: up to five actions in priority order, each
marked **theme** (code) or **content** (wp-admin).

Verdict per page: `pass` (no errors or warnings), `pass with warnings`, or
`fail (n errors)`. Group repeated findings (for example 12 images without
dimensions) into one row with a count. Never report a pass for a page that did
not load.

You may suggest better title or description wording. Label it as a suggestion,
keep it to the page's real content, and never invent facts about the business.

When run inside an active spec, a page without errors is the evidence for an SEO
`Done when`. It does not change the spec status; `/check` does that.
