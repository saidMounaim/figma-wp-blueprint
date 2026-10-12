---
name: cpt
description: Register a WordPress Custom Post Type with its taxonomies, ACF field group, and archive and single templates built from Figma. Use for /cpt <name>, adding a post type, adding a taxonomy, or when a build step needs a CPT.
---

# cpt - Custom Post Type with taxonomies, fields, and templates

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

A recipe skill. Inside an active spec, `/implement` follows it for CPT steps. Run
directly with no active spec, it does the work as direct work and says no spec is
logging it; for planned work prefer `/feature` first.

## Input

The CPT name, singular (`/cpt project`), optionally with taxonomies and Figma
node URLs for the archive, single, and card. Fall back to the Content types
section of `blueprint/design/design-system.md`.

## Decide before writing

Confirm these from the plan or design, and ask only when they are missing:

- slug (singular, lowercase, max 20 chars, not a reserved term like `post`,
  `page`, `type`, `category`, `tag`, `author`, `order`)
- public detail pages? (`public`, `publicly_queryable`) or listing-only content
  (for example testimonials shown inside sections only)
- archive URL (`has_archive` plus `rewrite` slug, usually plural: `projects`)
- `supports`: title, editor, thumbnail, excerpt, as the design needs
- taxonomies: hierarchical (like categories) or flat (like tags), and whether
  they filter the archive
- `menu_icon`: a Dashicon matching the content

## Steps

1. **Register** in `inc/post-types/<slug>.php` following
   `reference/cpt-example.md`: full labels with the text domain,
   `show_in_rest => true`, taxonomies in the same file, hooked on `init`.
   `functions.php` already loads every file in `inc/post-types/`.
2. **Fields** - follow `/acf` for `group_<slug>_fields.json`, located on the post
   type, from the Figma single and card designs.
3. **Card component** - `template-parts/components/<slug>-card.php` plus
   `assets/css/components/<slug>-card.css`, from the Figma card node. Used by the
   archive and by any section that lists this CPT.
4. **Archive** - `archive-<slug>.php` (and `taxonomy-<tax>.php` when the term
   pages differ) from the Figma archive node: main loop, card component,
   `the_posts_pagination()`. Set `posts_per_page` with a `pre_get_posts` hook in
   the CPT file when it differs from the Reading setting.
5. **Single** - `single-<slug>.php` from the Figma single node, reading the CPT
   fields with `get_field()`.
6. **Sections that list the CPT** (for example "latest projects") query with
   `WP_Query` using explicit `posts_per_page`, `no_found_rows => true` when there
   is no pagination, and `wp_reset_postdata()`.
7. **Permalinks** - tell the user to flush once: **Settings > Permalinks > Save**.
   Never call `flush_rewrite_rules()` on every load.
8. **Verify** - `Verify` command, then ask the user to add 3 sample posts (give
   them the Figma content to paste), load the archive and a single page, check
   `debug.log`, and run `/pixel-check` on archive, single, and card.

## Rules

- CPTs stay in the theme (`inc/post-types/`) unless the spec says to move them
  to a plugin. Content survives a theme switch in the database, but the type is
  not registered without the theme; mention this once in the spec's notes.
- Never rename a slug after content exists without a migration plan and the
  user's explicit decision.
