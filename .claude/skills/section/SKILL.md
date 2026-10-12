---
name: section
description: Build one Figma section as a pixel-perfect Flexible Content layout - ACF clone group, page builder layout, PHP template part, scoped pure CSS from Figma tokens, and optional vanilla JS - then pixel-check it at every breakpoint. Use for /section <figma-node-url or layout name>, or when a build step creates or changes a page section.
---

# section - one Figma section, end to end

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

A recipe skill. Inside an active spec, `/implement` follows it for each section
step. Run directly with no active spec, it builds the section as direct work and
says that no spec is logging it; for planned work prefer `/feature` first.

## Input

A Figma node URL for the section (`...?node-id=12-345`), or a layout name from
the section inventory in `blueprint/design/design-system.md`. When the section
has several breakpoint frames, use the node IDs for each from the inventory.

## Prerequisites

- The theme foundation exists (`inc/acf.php`, `group_page_builder.json`,
  `template-parts/flexible-content.php`). If not, run `/wp-theme` first.
- The Figma token works (`node .claude/skills/figma/scripts/figma.mjs check`).

## Step 1 - read the design

For the section node at each designed breakpoint:

1. Render the visual target if it is not in `blueprint/reference/` yet:
   `node .claude/skills/figma/scripts/figma.mjs images <url> --name section-<layout>-<width> --out blueprint/reference`,
   then view it.
2. `node .claude/skills/figma/scripts/figma.mjs node <url>` and read the saved
   JSON: structure, text, `box` sizes and positions, auto-layout `gap` and
   `padding`, `font`, `fills`, `radius`, `effects`, and image fills (ratio =
   `box.w / box.h`).
3. Map every value to a token in `assets/css/variables.css`. A value with no
   token is either a section-local value (fine, keep it as a custom property at
   the top of the section CSS) or a missing token (add it to `variables.css` and
   note it).

Check whether the section already exists in `template-parts/sections/`. If it
does, this is a variant or change, not a new section: prefer a modifier field
(for example `style: light|dark`) over a near-duplicate layout.

## Step 2 - fields

Follow `/acf` (`../acf/SKILL.md`): create `acf-json/group_section_<layout>.json`
and add the layout to `group_page_builder.json`. Every editable text, image,
link, and repeated item from the design becomes a field; decoration stays in the
template.

## Step 3 - template part

Write `template-parts/sections/<layout-kebab>.php` following
`reference/section-example.md`:

- ABSPATH guard, read every field into a variable at the top
- return early when the section's required content is empty
- root element `<section class="<layout-kebab>" data-section="<layout-kebab>">`
- BEM classes, semantic headings (the first section on a page owns the `h1` only
  when the design says so; otherwise `h2`)
- escape every output by type; images through `wp_get_attachment_image`
- reuse `template-parts/components/` for buttons and cards

## Step 4 - CSS

Write `assets/css/sections/<layout-kebab>.css`:

- mobile-first: base rules from the smallest Figma frame, then `min-width`
  media queries at the designed breakpoints
- only tokens from `variables.css`, plus section-local custom properties
- `clamp()` for type and padding that scale between frames
- match Figma exactly: box sizes, gaps, line heights, letter spacing, image
  aspect ratios (`aspect-ratio` + `object-fit`)
- hover and focus states as designed; `prefers-reduced-motion` for any motion

## Step 5 - JS (only when the section has behavior)

Write `assets/js/sections/<layout-kebab>.js` following the example: find all
`[data-section="<layout-kebab>"]`, exit when none, no globals, ARIA state, and
keyboard support. Animations beyond simple transitions are noted in the spec as
a later item unless the spec includes them.

## Step 6 - verify

1. Run the `Verify` command from `AGENTS.md`.
2. Ask the user to add the section to a test page with the real Figma copy and
   images (or do it with browser automation when available). Give them the exact
   field values from Figma to paste.
3. Run `/pixel-check` for this section at every breakpoint. Repair differences
   above tolerance, then re-check. Stop after three rounds and report what still
   differs.
4. Confirm no notices in `debug.log` and no console errors.

## Rules

- One section = one name across ACF layout, clone group, PHP, CSS, and JS files.
- No CSS outside the section's file except new tokens in `variables.css` and
  shared components.
- Positions in the JSON are absolute. Translate them into Flexbox/Grid with gaps
  and padding; never into absolute positioning.
