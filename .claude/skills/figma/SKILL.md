---
name: figma
description: Read a Figma URL (design, file, or proto link) through the Figma REST API helper script and extract design tokens, breakpoints, fonts, assets, and a section inventory into blueprint/design/, then propose plan content. Use for /figma <url>, design intake, extracting tokens, or mapping a Figma design to WordPress sections.
disable-model-invocation: true
---

# figma - turn a Figma URL into a WordPress build map

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

**First action:** Before any other tool call, publish `running` to
`blueprint/.state/run.json` using the dashboard activity contract in `AGENTS.md`,
with command `figma`.

Where this sits in the workflow:

    /onboard  ->  [figma <url>]  ->  review plans  ->  /overview  ->  /wp-theme
                  (design-system.md,
                   reference screenshots,
                   proposed plan)

This skill reads the design and writes the design map. It never writes theme
code. Its outputs:

- `blueprint/design/design-system.md` - tokens, breakpoints, fonts, section
  inventory, CPT candidates, global settings, Figma node index
- `blueprint/design/tokens.css` - the tokens as CSS custom properties, ready for
  `/wp-theme` to copy into `assets/css/variables.css`
- `blueprint/reference/*.png` - reference renders of pages and sections
- proposed edits to `blueprint/project-plan.md` and `blueprint/build-plan.md`,
  applied only after approval

## The helper script

All Figma access goes through one script that calls the Figma REST API. The user
only gives URLs; the script parses any `figma.com/design|file|proto|board` link
and its `node-id`.

```text
F=.claude/skills/figma/scripts/figma.mjs
node $F check                                  # token works?
node $F outline <url> --depth 3                # layer tree with node ids and sizes
node $F node    <url>                          # simplified JSON -> blueprint/.state/figma/
node $F tokens  <url>                          # colors, text styles, spacing, radii, shadows
node $F images  <url> --ids 1:2,3:4 --name home --out blueprint/reference
node $F images  <url> --ids 5:6 --format svg --name logo --out assets/icons
node $F fills   <url> --out blueprint/reference/fills   # photos used in the node
```

To target a different node in the same file, reuse the URL and change only the
`node-id` (`2044:63` and `2044-63` are the same node), or pass `--ids`.

The token is read from the `FIGMA_TOKEN` environment variable or a
`FIGMA_TOKEN=...` line in `.env` at the project root. Never print, echo, or
commit it. If `check` fails, stop and tell the user to create one at
**figma.com > Settings > Security > Personal access tokens** (scope: file
content, read-only) and add it to `.env`. `.env` must be in `.gitignore`.

## Input

A Figma URL. A `proto` link's `node-id` is the starting frame of the prototype;
a link with no `node-id` means the whole file. With a whole file or page, list
the pages and top-level frames from `outline` and ask which are in scope. A
second run with another URL adds to the existing map instead of replacing it.

## Step 1 - map the structure

1. `outline <url> --depth 2`. If the node is a single frame, run `outline` on its
   parent page (URL without `node-id`, `--depth 2`) to find the sibling frames
   for other breakpoints and pages.
2. Group frames by page and breakpoint. The frame width is the breakpoint
   (`Home - 1440`, `Home - 375`). Record each designed width. Frames named
   like mobile with no matching desktop (or the reverse) go to Open questions.
3. For each in-scope page frame, `outline <frame-url> --depth 3`. The direct
   children that span the frame width and stack vertically are **sections**
   (hero, features, testimonials, CTA, footer). Name each by its role, not its
   layer name.
4. Detect **repeats**: the same section on several pages, or the same component
   (card, button, badge; `INSTANCE` nodes of one component). Repeated sections
   become one Flexible Content layout; repeated components become
   `template-parts/components/`.
5. Detect **CPT candidates**: repeated content items with their own detail page
   or listing (lawyers, practice areas, news, projects, team, testimonials).
   Note their visible fields.
6. Detect **global parts**: header, footer, navigation. Their editable content
   goes to the ACF options page.

## Step 2 - extract tokens

1. `tokens <page-frame-url>` for each breakpoint frame. Prefer values that repeat;
   one-off values are usually section-local.
2. When a value needs context, `node <section-url>` and read the saved JSON:
   `box` (position relative to the node), `layout` (auto-layout gap, padding
   `[top, right, bottom, left]`, alignment), `fills`, `stroke`, `effects`,
   `radius`, `font`, and `styleNames` (Figma style names, the best token names).
3. Collect:
   - colors named by role (`--color-primary`, `--color-text`, `--color-surface`,
     `--color-border`)
   - font families and weights
   - type scale per breakpoint: size, line height, letter spacing, weight per
     text style (`--fs-h1`, `--lh-h1`). When mobile and desktop differ, record
     both and a `clamp()` between them.
   - spacing scale, radii, shadows, container width and side gutters per
     breakpoint (gutter = first content child's `box.x` inside the frame)
4. Convert px to rem by dividing by 16. Keep borders in px.

Write `blueprint/design/tokens.css` as one `:root` block grouped by colors, fonts,
type, spacing, radii, shadows, layout, with breakpoints listed in a comment at the
top (custom properties cannot be used in media queries).

## Step 3 - fonts and assets

- List each font family and weight. Note whether it is a Google Font (enqueue or
  self-host) or a licensed font the user must provide.
- Logos and icons: `images --format svg` into `assets/icons/` only after the
  theme folder exists and the user approves; otherwise list node ids for later.
- Content photos are placeholders for the media library: `fills` downloads them
  into `blueprint/reference/fills/` so the user can upload them.

## Step 4 - reference renders

`images` for each in-scope page frame (`--name <page>-<width>`) and for each
section node (`--name section-<layout>-<width>`) into `blueprint/reference/`.
These are the visual targets for `/section` and `/pixel-check`. View them to
confirm the section split from Step 1.

## Step 5 - write design-system.md

Write `blueprint/design/design-system.md` with these sections:

- **Source** - Figma URL as given, file key, date read
- **Breakpoints** - each designed width and its mobile-first `min-width` query
- **Tokens** - pointer to `tokens.css` and a short table of main colors and
  text styles
- **Fonts** - families, weights, loading method
- **Global parts** - header and footer: node ids per breakpoint, options-page
  fields, menu locations
- **Section inventory** - table: layout name (snake_case), role, node id per
  breakpoint, pages using it, proposed ACF fields (name, type), JS needed?
- **Components** - reusable pieces and their node ids
- **Content types** - CPT candidates with fields, taxonomies, archive and single
  node ids
- **Interactions** - menus, sliders, accordions, hover states, animations
  (prototype links are not exposed by the API; ask the user or note from the
  design; animation details can be explored later)
- **Open questions** - missing breakpoints, inconsistent values, unclear states

Every node id and value must come from the script output.

## Step 6 - propose the plan

Draft, but do not write yet:

- `project-plan.md` sections 2 to 7 filled from the map
- `build-plan.md` items: theme foundation (`/wp-theme`), one item per page (new
  sections only; reused sections are built once), one per CPT, then
  interactions and polish

Show the drafts and the open questions. Write the plan files only after the user
approves; preserve real content already in them. Then update activity to `ready`
and point to `/overview`.

## Rules

- Read-only on theme code. This skill writes under `blueprint/` only, plus
  approved icon exports.
- Never invent a value. If a token differs across frames, list both in Open
  questions instead of averaging.
- Large files: use `outline` with small depth first, then `node` on single
  sections. Never fetch a whole file at full depth.
- A 403 means the token cannot see the file: ask the user to check the token
  and that their Figma account has access to the file.

## Formatting

Format the output to match the project's conventions in
`blueprint/context/ai-interaction.md`.
