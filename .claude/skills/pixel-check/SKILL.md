---
name: pixel-check
description: Compare a rendered LocalWP page or section against its Figma frame at every designed breakpoint, measuring computed styles and boxes against Figma values, and report differences without editing code. Use for /pixel-check <local-url> [figma-node-url], pixel-perfect review, design QA, or checking a section against Figma.
---

# pixel-check - measured design QA against Figma

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

Read-only. It reports differences; `/implement` (or `/section` during a build
step) fixes them. It never edits theme files.

## Input

- a local URL (`http://<site>.local/about/`), optionally with a section selector
  (`.hero`) or layout name
- a Figma node URL for the page or section. When omitted, look it up in the
  section inventory or global parts of `blueprint/design/design-system.md`.

## Prerequisites

- The Figma token works (`node .claude/skills/figma/scripts/figma.mjs check`).
- Browser automation available (for example the Playwright MCP). If none is
  available, stop and tell the user how to add it:
  `claude mcp add playwright -- npx @playwright/mcp@latest`. Do not pass a check
  from code reading.
- The LocalWP site is running. If the URL does not load, ask the user to start
  the site in LocalWP.

## Steps

For each designed breakpoint in `design-system.md`:

1. **Figma side** - with `.claude/skills/figma/scripts/figma.mjs`: `images` of
   the node at that breakpoint's frame (`--scale 1` so 1 image px = 1 CSS px),
   and `node` for exact values: box widths and heights, paddings, gaps, font
   family, weight, size, line height, letter spacing, colors, radii, shadows,
   image aspect ratios.
2. **Browser side** - set the viewport width to the frame width (height large
   enough for the section), load the URL, wait for fonts
   (`document.fonts.ready`), scroll the section into view, and take a screenshot
   of the same region.
3. **Measure** - evaluate `getBoundingClientRect()` and `getComputedStyle()` for
   the section root and its key elements (title, text, buttons, images, cards,
   gaps between items). Compare each against the Figma value.
4. **Compare visually** - view both screenshots side by side for differences the
   numbers miss: alignment, wrapping, missing elements, wrong image crop, wrong
   icon, order.
5. **Interaction states** - when the design defines hover, focus, or open
   states, trigger them and compare.

## Tolerance

From `blueprint/context/coding-standards.md`:

- spacing, size, position: 2px
- font family, weight, color, radius: exact
- line wrapping that differs only because the real content differs from Figma
  is not a defect; say so and recommend matching content

## Report

One table per breakpoint, only rows that fail or are notable:

| Element | Property | Figma | Browser | Diff | File to fix |
| --- | --- | --- | --- | --- | --- |
| `.hero__title` | font-size | 56px | 52px | -4px | `assets/css/sections/hero.css` |

Then a verdict per breakpoint: `pass`, `fail (n differences)`, or
`unverifiable (reason)`. Save screenshots in the session scratch area, not the
theme. Never report a pass without both screenshots and measurements.

When run inside an active spec, a full pass at every breakpoint is the evidence
for a visual `Done when`. It does not change the spec status; `/check` does that.
