# Build Plan

List the features in rough build order, one line each. `/figma` proposes this
list from the design; edit it freely. When both planning docs are ready, run
`/overview`. It adds tracking numbers and checkboxes before generating the
project overview.

Run `/feature` to spec the next unchecked item, or `/feature 2` to pick one.
Keep completed items checked and append new features as the project grows.
Do not renumber completed features; their archived specs refer to those IDs.

A typical order:

1. Theme skeleton, tokens, header, footer, page builder (`/wp-theme`)
2. One feature per page, building its new sections (`/section`)
3. One feature per Custom Post Type, with archive and single templates (`/cpt`)
4. Global interactions, forms, and final responsive polish

## Your features

Replace these examples with your own features:

- [ ] 1. **Theme foundation** - theme skeleton, Figma tokens, base CSS, header, footer, options page, Flexible Content page builder
- [ ] 2. **Home page** - hero, services, testimonials, CTA sections
- [ ] 3. **Projects CPT** - projects post type, category taxonomy, archive and single templates
