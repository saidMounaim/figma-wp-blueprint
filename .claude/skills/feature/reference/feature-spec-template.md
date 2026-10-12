# Feature: <name>

**From build-plan:** feature <n>
**Build attempt:** <positive integer, starting at 1>
**Status:** not started
**Branch:** `feature/<name>`

## Goal

What this feature delivers, in a sentence or two. Why it matters.

## Design reference

| Section / template | Layout or file | Figma node per breakpoint | Screenshot | New or reused |
| --- | --- | --- | --- | --- |
| Hero | `hero` | 375: `12:345`, 1440: `12:300` | `blueprint/reference/section-hero-1440.png` | new |

Omit this section when the feature has no visual target.

## In scope

- The specific things this feature includes.

## Out of scope

- What it deliberately doesn't touch (deferred to a later feature).

## Build loop

Build one small step at a time. Follow `workflow.stepReview` in
`blueprint/config.json`: `feature` produces one review packet after all steps,
while `every` pauses for review after each step. Offer checkpoint commits only
when `workflow.checkpointCommits` is enabled. `/complete` makes the final feature
commit. Never accept a review packet you have not read; split any diff that is
too large to review.

## Build steps

Small, reviewable units. Each ends with something working. `/implement` checks
these off as it finishes them, so progress survives a context clear: a fresh
session reads which boxes are ticked and resumes from the first unchecked step.

- [ ] **Step 1 - <step>** - what you build. *Done when:* <observable criteria>.
- [ ] **Step 2 - <step>** - what you build. *Done when:* <observable criteria>.

## Files / areas

- The files or modules this will create or change.

## Data / contracts

- ACF field groups and fields added or changed (`acf-json/` file, field names,
  types, return formats), CPT slugs and taxonomies, options page fields, or
  "none."
- For established persisted-data or external API boundaries, record only the
  material type, format, generation source, uniqueness, default, lifecycle, and
  error behavior that implementation or later features must preserve.
- For established security, tenant, concurrency, destructive-operation, payment,
  or sensitive-data boundaries, record the trusted actor source,
  repository-first tenant scope, atomicity, idempotency, and redaction rules
  that apply.
- Do not create contracts or machinery for hypothetical future boundaries.

## Testing

- `Verify` command (PHP lint and ACF JSON validity).
- `/pixel-check` URL and Figma node per visual step, at every designed breakpoint.
- Test content to enter in the admin (copy from Figma) and the pages to load.
- `debug.log` clean and no console errors.

## Notes for the AI

- Recipes to follow (`/section`, `/acf`, `/cpt`), escaping rules, reused
  components, and anything from `coding-standards.md` that matters here.
