---
name: acf
description: Create or change ACF Pro field groups as local JSON in the theme's acf-json folder - section clone groups, the Flexible Content page builder, options page fields, and CPT fields - with deterministic keys and matching template reads. Use for /acf, adding fields, editing a field group, or when a build step needs ACF fields.
---

# acf - field groups as local JSON

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

A recipe skill. Inside an active spec, `/implement` uses it for steps that add or
change fields. Run directly, it makes the requested field change as small
direct work and says that no spec is logging it.

## Input

What to create or change, for example:

- `/acf section hero` - the clone group for a section
- `/acf add "subtitle" text to hero`
- `/acf options footer socials` - fields on the Theme Settings options page
- `/acf cpt project` - the field group for a CPT

## Steps

1. Read the ACF section of `blueprint/context/coding-standards.md` and
   `reference/acf-json.md`.
2. Read the existing JSON in `acf-json/` for the groups you will touch, and
   search the theme for every `get_field`/`get_sub_field` that reads them.
3. Pick the group by purpose:
   - section content -> `group_section_<layout>.json` (inactive, cloned into the
     page builder)
   - new section on the page builder -> also add a layout to
     `group_page_builder.json`
   - header, footer, global data -> `group_theme_settings.json` (options page)
   - CPT data -> `group_<cpt>_fields.json`
4. Derive fields from the Figma node (`figma.mjs node <url>`, text and image
   fills) or the section
   inventory in `blueprint/design/design-system.md`: every piece of content an
   editor should change becomes a field. Fixed decoration stays in the template.
5. Write the JSON with deterministic keys, the return formats from the standards,
   sensible `instructions`, `required` only where the design breaks without it,
   and `modified` set to the current Unix time.
6. Renaming or removing a field orphans existing content. Before changing a
   field `name` on a site with content, stop and ask. Prefer adding over
   renaming.
7. Update the template reads to match, escaping by field type.
8. Validate: the JSON parses (`php -r "json_decode(file_get_contents('acf-json/<file>.json')); echo json_last_error_msg();"`),
   all keys are unique across `acf-json/`, and the admin edit screen shows the
   fields (ask the user to confirm, or check with browser automation).

## Rules

- JSON in `acf-json/` is the source of truth. Never register field groups in PHP
  with `acf_add_local_field_group` unless the spec says so.
- Never duplicate a key. Search all of `acf-json/` before writing a new one.
- If the admin shows "Sync available" for a group, the database copy differs
  from the JSON. Tell the user; do not edit the database.
- Keep labels in the client's language and field names in English snake_case.
