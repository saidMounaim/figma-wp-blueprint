# Coding Standards

> House conventions for Figma-to-WordPress classic themes: PHP templates, ACF Pro
> Flexible Content, Custom Post Types, pure CSS, and vanilla JS. No page
> builders, no CSS frameworks, no jQuery, no build step. `/onboard` fills in the
> project-specific values (theme slug, prefix, breakpoints) and leaves the rest.

## Stack

- Classic PHP theme (not a block theme, no `theme.json`-driven layout)
- ACF Pro: Flexible Content for page sections, options page for global settings
- Custom Post Types and taxonomies registered in the theme
- Pure CSS with custom properties, no preprocessor, no Tailwind, no bundler
- Vanilla JavaScript, no jQuery, no framework, no bundler
- Local development: LocalWP
- Design source: Figma URLs, read through the Figma REST API helper
  (`.claude/skills/figma/scripts/figma.mjs`)

## Project identity

- Theme slug and text domain: `<theme-slug>` <!-- set by /onboard -->
- PHP function and hook prefix: `<prefix>_` <!-- set by /onboard -->
- Local URL: `http://<site>.local` <!-- set by /onboard -->
- The Git repository root is the theme folder
  (`app/public/wp-content/themes/<theme-slug>/` inside the LocalWP site), unless
  `AGENTS.md` says otherwise.

## Theme structure

```text
<theme-slug>/
  style.css                    theme header only, no rules
  functions.php                only require_once files from inc/
  screenshot.png
  header.php  footer.php  index.php  page.php  front-page.php  404.php
  single.php  archive.php  single-<cpt>.php  archive-<cpt>.php  (as needed)
  inc/
    setup.php                  theme supports, menus, image sizes
    enqueue.php                styles and scripts
    acf.php                    acf-json paths, options page, missing-ACF notice
    helpers.php                small template helpers
    post-types/<cpt>.php       one CPT and its taxonomies per file
  acf-json/                    ACF local JSON, committed
  template-parts/
    flexible-content.php       loops the page_sections layouts
    sections/<layout>.php      one file per Flexible Content layout
    components/<name>.php      reusable pieces (button, card, media)
  assets/
    css/variables.css          design tokens from Figma
    css/base.css               reset, typography, container, shared utilities
    css/components/<name>.css
    css/sections/<layout>.css  one file per layout, same name as the PHP part
    js/main.js                 global behavior (header, menu toggle)
    js/sections/<layout>.js    only when the section has behavior
    images/  icons/  fonts/
```

One section = one name used everywhere: the ACF layout name, the clone group
`group_section_<layout>`, `template-parts/sections/<layout>.php`,
`assets/css/sections/<layout>.css`, and optional `assets/js/sections/<layout>.js`.
Use snake_case for the ACF layout name and kebab-case for the files and CSS class
(`hero_split` -> `hero-split.php`, `.hero-split`).

## PHP and WordPress

- Follow WordPress PHP coding standards (tabs, Yoda conditions optional, spaces
  inside parentheses).
- Prefix every global function, constant, hook, and handle with the theme prefix.
- Every file under `inc/` and `template-parts/` starts with
  `defined( 'ABSPATH' ) || exit;`.
- Templates hold markup. Move any logic longer than a few lines into
  `inc/helpers.php` or a section-local variable block at the top of the part.
- Use `get_template_part( 'template-parts/sections/hero-split', null, $args )` and
  read `$args` in the part. Do not rely on globals.
- Use WordPress APIs before custom code: `wp_nav_menu`, `the_post_thumbnail`,
  `wp_get_attachment_image`, `paginate_links`, `get_the_terms`.
- Custom queries use `WP_Query` with explicit `posts_per_page`, then
  `wp_reset_postdata()`. Never `query_posts`.
- Hard-coded user-facing strings go through `esc_html__()` or `esc_html_e()` with
  the theme text domain.

## Escaping and sanitizing (never skip)

- Escape late, at output, with the function that matches the context:
  `esc_html` for text, `esc_attr` for attributes, `esc_url` for URLs,
  `wp_kses_post` for ACF WYSIWYG fields.
- Never `echo get_field()` raw. Read into a variable, check it, escape it.
- Forms, AJAX, and REST handlers verify a nonce and a capability, then sanitize
  every input (`sanitize_text_field`, `absint`, `sanitize_email`) after
  `wp_unslash`.
- Raw SQL only through `$wpdb->prepare`.

## ACF

- Field groups live in `acf-json/` (save and load points set in `inc/acf.php`)
  and are committed. Local JSON works without syncing to the database; use
  **Custom Fields > Sync** only when someone needs to edit a group in the admin.
- When the AI writes JSON directly, use readable deterministic keys:
  `group_<name>`, `field_<group>_<field>`, `layout_<layout>`. Keys must be
  unique across the site. Bump `modified` to the current Unix time on every edit.
- **Page builder:** one field group `group_page_builder` with a Flexible Content
  field `page_sections`, shown on pages. Each layout contains one seamless Clone
  field that clones `group_section_<layout>`. Each section group is inactive
  (`"active": false`) so it only appears through the clone.
- **Global settings:** an ACF options page `Theme Settings` for header and footer
  data (logo, contact info, socials, footer text). Read with
  `get_field( 'name', 'option' )`.
- **CPT fields:** one group `group_<cpt>_fields` located on that post type.
- Field names are snake_case and describe content, not style (`heading`, not
  `big_text`).
- Return formats: Image and File return **ID**; Link returns **array**;
  Relationship and Post Object return **ID**; Gallery returns **IDs**.
- Every optional field is guarded in the template so an empty field outputs no
  empty wrapper.

## Custom Post Types

- One file per CPT in `inc/post-types/`, registered on `init`.
- Always set `labels`, `public`, `has_archive`, `rewrite` slug, `menu_icon`,
  `supports`, and `show_in_rest` (true so the editor and REST work).
- Taxonomies for that CPT live in the same file.
- After adding or changing a rewrite slug, flush permalinks once
  (**Settings > Permalinks > Save**). Never call `flush_rewrite_rules()` on every
  request.

## CSS (pure, pixel-perfect)

- All design values come from `assets/css/variables.css` custom properties
  extracted from Figma: colors, font families, font sizes, line heights, letter
  spacing, spacing scale, radii, shadows, container width. No raw hex or magic
  numbers in section CSS when a token exists.
- Mobile-first. Breakpoints match the Figma frames and are listed in
  `variables.css` and `blueprint/design/design-system.md`. Custom properties
  cannot be used in media queries, so write the pixel values directly.
- Sizes: `rem` for type and spacing (Figma px / 16), `px` for borders and hairlines.
  Use `clamp()` between the mobile and desktop Figma values for fluid type and
  section padding.
- Naming: BEM scoped to the section: `.hero-split`, `.hero-split__title`,
  `.hero-split--dark`. Never style bare tags inside a section except through
  the section class.
- Layout with Flexbox and Grid. No floats, no absolute positioning for layout.
- No `!important`, no inline `style` attributes except a CSS variable set from
  an ACF value (`style="--bg: url(...)"`).
- Respect `prefers-reduced-motion` for any transition or animation.

## JavaScript (vanilla)

- No jQuery, no libraries unless the spec approves one (for example a slider).
- One file per behavior. Each section script finds its roots by
  `[data-section="<layout>"]`, returns early when none exist, and keeps no
  globals (wrap in a block or IIFE).
- Hook JS to `data-` attributes, not styling classes.
- Toggle state with classes and ARIA attributes (`aria-expanded`,
  `aria-hidden`), not inline styles.
- Keyboard and focus support for menus, tabs, accordions, sliders, and modals.

## Enqueueing assets

- `inc/enqueue.php` enqueues `variables.css`, then `base.css`, then every file
  in `css/components/` and `css/sections/` (loop with `glob`). Version each
  file with `filemtime` so cache busting is automatic.
- Scripts load in the footer with `'strategy' => 'defer'`. Section scripts are
  enqueued the same way by looping `js/sections/`.
- Fonts: self-hosted `woff2` in `assets/fonts/` with `font-display: swap` when
  the files are available; otherwise enqueue Google Fonts with `display=swap`.
  Record the choice in `blueprint/design/design-system.md`.

## Images and media

- Output images with `wp_get_attachment_image( $id, $size, false, $attrs )` so
  `srcset`, `sizes`, `alt`, and lazy loading come from WordPress. Above-the-fold
  hero images get `'loading' => 'eager'` and `'fetchpriority' => 'high'`.
- Register image sizes in `inc/setup.php` only for crops the design needs.
- Decorative SVG icons are inlined from `assets/icons/` through a helper; content
  images go through the media library.

## Accessibility

- Semantic landmarks (`header`, `nav`, `main`, `footer`), one `h1` per page, and
  heading levels that follow the design hierarchy, not the font size.
- Visible focus styles matching the design's accent color.
- Text alternatives come from the media library `alt`, never hard-coded.
- Color contrast from Figma is used as-is. Flag low-contrast pairs in review
  rather than silently changing the design.

## Pixel-perfect verification

- A section is done only when `/pixel-check` compares it against its Figma frame
  at every designed breakpoint and reports no unresolved difference above the
  tolerance: 2px for spacing and size, exact for color and font family and weight.
- Pixel check uses real content, not lorem ipsum, matching the Figma copy.

## Testing

There is no unit test runner in a classic theme by default. The evidence for
each step is:

- `php -l` on every changed PHP file (part of `Verify` in `AGENTS.md`)
- valid JSON in every changed `acf-json/*.json`
- the page rendering in the LocalWP site with no PHP notices or warnings
  (`WP_DEBUG` and `WP_DEBUG_LOG` on in `wp-config.php` locally) and no browser
  console errors
- `/pixel-check` for visual steps

Do not add PHPUnit, Playwright, or a bundler mid-feature. Adding tooling is its
own reviewed step.

## Code Quality

- No commented-out code unless specified
- No unused functions, variables, or template parts
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
