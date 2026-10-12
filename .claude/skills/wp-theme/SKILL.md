---
name: wp-theme
description: Scaffold the classic WordPress theme foundation from the Figma design map - style.css, functions.php, inc/ setup, asset enqueueing, ACF local JSON and options page, the Flexible Content page builder loop, header, footer, tokens, and base CSS. Use for /wp-theme, theme foundation, or the first build-plan feature.
disable-model-invocation: true
---

# wp-theme - build the theme foundation

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

**First action:** Before any other tool call, publish `running` to
`blueprint/.state/run.json` using the dashboard activity contract in `AGENTS.md`,
with command `wp-theme`.

Where this sits in the workflow:

    /figma  ->  /overview  ->  [wp-theme]  ->  /feature 2 ...
                               (feature 1: the skeleton every
                                section and CPT plugs into)

The theme foundation is normally build-plan feature 1. This skill is its recipe.

## Mode

- **No active spec** (`current-feature.md` is the stub): run the `/feature` flow
  for the theme-foundation build-plan item, using the build steps below as the
  spec's Build steps. Fill in the real values (slug, prefix, breakpoints, menus,
  options fields) from `AGENTS.md`, `coding-standards.md`, and
  `blueprint/design/design-system.md`. Stop for spec approval, like `/feature`.
- **Active spec is the theme foundation**: this file is the build recipe that
  `/implement` follows. Implement through `/implement`, not here.
- **Theme already has `style.css` and `functions.php`**: do not overwrite. Report
  what exists, and propose only the missing pieces as a spec.

## Prerequisites

Stop and name the missing item when any is absent:

- `/onboard` finished: theme slug, prefix, and local URL are set in
  `coding-standards.md` (no `<theme-slug>` placeholder left)
- `blueprint/design/design-system.md` and `blueprint/design/tokens.css` exist
  (run `/figma <url>` first)
- ACF Pro is active on the local site (ask the user to confirm when you cannot
  check)

## Build steps (spec template)

Use these as the spec's steps. Each ends with the site loading without PHP
notices.

1. **Theme bootstrap** - `style.css` header, `functions.php`, `inc/setup.php`
   (title tag, post thumbnails, HTML5, custom logo, menu locations from the
   design, image sizes the design needs, block editor disabled for pages so
   the page builder is the only page editing UI), `inc/helpers.php`, `index.php`,
   `404.php`. *Done when:* the theme activates and the home page renders with no
   notices in `debug.log`.
2. **Tokens and base CSS** - copy `blueprint/design/tokens.css` to
   `assets/css/variables.css`, write `assets/css/base.css` (modern reset, font
   faces or font enqueue, body and heading typography from tokens, `.container`
   with the Figma container width and gutters per breakpoint, button styles,
   visually-hidden and focus utilities), `inc/enqueue.php`.
   *Done when:* the browser shows the Figma fonts and body styles and both files
   load with `filemtime` versions.
3. **ACF setup** - `inc/acf.php` (local JSON save/load to `acf-json/`, `Theme
   Settings` options page, admin notice when ACF Pro is missing), the
   `group_theme_settings` field group for header and footer data, and
   `group_page_builder` with an empty `page_sections` Flexible Content field.
   *Done when:* Theme Settings appears in the admin and pages show an empty
   Sections field.
4. **Page builder loop** - `page.php` and `template-parts/flexible-content.php`
   that render each layout from `template-parts/sections/<layout>.php`.
   *Done when:* a page with no sections renders header and footer only, without
   notices.
5. **Header** - `header.php` built from the Figma header node at every
   breakpoint, logo from the options page or custom logo, `wp_nav_menu`, mobile
   menu toggle in `assets/js/main.js` with `aria-expanded` and keyboard support.
   *Done when:* `/pixel-check` on the header passes at every breakpoint.
6. **Footer** - `footer.php` from the Figma footer node, content from the options
   page, footer menus. *Done when:* `/pixel-check` on the footer passes at every
   breakpoint.

Templates for these files are in `reference/theme-files.md`. ACF JSON shapes are
in `../acf/reference/acf-json.md`. Replace every `{prefix}`, `{text-domain}`, and
`{Theme Name}` placeholder with the project values.

## Rules

- Follow `blueprint/context/coding-standards.md` exactly; it wins over the
  reference templates when they disagree.
- No starter theme, no `_s` download, no page builder plugin, no npm.
- Never edit files outside the theme folder.
- Header and footer are part of this feature; page sections are not. Sections
  are built in later features with `/section`.

## Formatting

Format the output to match the project's conventions in
`blueprint/context/ai-interaction.md`.
