<div align="center">

# figma-wp-blueprint

**From a Figma URL to a pixel-perfect custom WordPress theme, built with Claude Code.**

ACF Pro Flexible Content · Custom Post Types · Pure CSS · Vanilla JS · LocalWP

![WordPress](https://img.shields.io/badge/WordPress-6.5%2B-21759B?logo=wordpress&logoColor=white)
![ACF Pro](https://img.shields.io/badge/ACF-Pro-00E4BC)
![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?logo=php&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-pure-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JS-vanilla-F7DF1E?logo=javascript&logoColor=black)
![Claude Code](https://img.shields.io/badge/Claude_Code-skills-D97757)

[Website](https://saidmounaim.github.io/figma-wp-blueprint/) ·
[Set up a project](#part-1---set-up-a-new-project) ·
[Commands](#commands) ·
[Troubleshooting](#troubleshooting)

</div>

---

## Contents

- [Why](#why)
- [How it works](#how-it-works)
- [What's in this repository](#whats-in-this-repository)
- [Requirements](#requirements)
- [Part 1 - Set up a new project](#part-1---set-up-a-new-project)
- [Part 2 - Build the theme foundation](#part-2---build-the-theme-foundation)
- [Part 3 - Build pages and post types](#part-3---build-pages-and-post-types)
- [Commands](#commands)
- [Theme structure](#theme-structure)
- [Configuration](#configuration)
- [Deploying the theme](#deploying-the-theme)
- [Updating an existing project](#updating-an-existing-project)
- [Troubleshooting](#troubleshooting)
- [Credits](#credits)

## Why

Turning a Figma design into a custom theme is repetitive: extract colors and
fonts, slice sections, create ACF fields, write templates, match every pixel.
**figma-wp-blueprint** gives Claude Code a set of WordPress-specific skills and
house rules so it does that work the same way every time, one reviewed feature
at a time:

- 🎨 **Paste a Figma URL** - tokens, breakpoints, fonts, and a section inventory
  are extracted for you
- 🧩 **One section = one Flexible Content layout** - ACF fields, PHP template,
  scoped CSS, and optional JS, all with the same name
- 📐 **Pixel-perfect by default** - every visual step is measured against Figma
  at each breakpoint
- 🔒 **WordPress-safe** - escaping, sanitizing, nonces, and query rules are
  enforced in review
- 🧾 **Reviewable history** - every feature has a spec, a branch, a review, and
  an archive

No page builder, no CSS framework, no jQuery, no build step.

## How it works

```mermaid
flowchart LR
    A[Figma URL] --> B["/figma"]
    B --> C[Design system<br/>+ build plan]
    C --> D["/overview"]
    D --> E["/wp-theme"]
    E --> F["/feature"]
    F --> G["/implement"]
    G --> H["/pixel-check"]
    H --> I["/complete"]
    I --> F
```

One Figma section becomes one Flexible Content layout, and the layout name is
used everywhere:

| Piece | File |
| --- | --- |
| Section fields | `acf-json/group_section_hero.json` |
| Page builder entry | `layout_hero` in `acf-json/group_page_builder.json` (clones the fields) |
| Markup | `template-parts/sections/hero.php` |
| Styles | `assets/css/sections/hero.css` |
| Behavior *(only when needed)* | `assets/js/sections/hero.js` |

The workflow files live **inside your theme folder**, and the theme folder is
your Git repository:

```text
Local Sites/your-site/app/public/wp-content/themes/your-theme/
├── AGENTS.md          <- AI instructions (from this repo)
├── CLAUDE.md          <- Claude Code entry point (from this repo)
├── .claude/           <- skills (from this repo)
├── blueprint/         <- plans, specs, design system (from this repo)
├── .env               <- your Figma token (never committed)
└── ...theme files created by /wp-theme
```

## What's in this repository

| Path | Copy into your theme? | Contents |
| --- | --- | --- |
| `AGENTS.md` | Yes | Project rules and workflow for the agent |
| `CLAUDE.md` | Yes | Claude Code entry point, imports `AGENTS.md` |
| `.claude/skills/` | Yes | The slash-command skills and the Figma helper script |
| `blueprint/` | Yes | Plans, coding standards, design system, spec, and history templates |
| `.gitignore` | No | `/onboard` creates or updates the theme's own `.gitignore` |
| `docs/` | No | The project website |
| `README.md` | No | This file |

## Requirements

| Tool | Why |
| --- | --- |
| [LocalWP](https://localwp.com/) | Local WordPress site (WordPress 6.5+, PHP 8.1+) |
| [ACF Pro](https://www.advancedcustomfields.com/pro/) | Flexible Content, clone fields, options page |
| [Claude Code](https://claude.com/claude-code) | Runs the skills (CLI or VS Code extension) |
| [Node.js 18+](https://nodejs.org/) | Figma helper and workflow scripts (no npm install needed) |
| [Git](https://git-scm.com/) | One branch per feature |
| PHP CLI | `php -l` syntax checks (LocalWP's **Open site shell** provides it) |
| Figma account | View access to the design file and a personal access token |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) *(optional)* | Browser screenshots and measurements for `/pixel-check` and `/check` |

## Part 1 - Set up a new project

> Do this once per website. Keep a clean copy of this repository and copy from
> it for every new project.

### 1. Create the site in LocalWP

Create a new site, for example `your-site`. It runs at
`http://your-site.local`. Start it and log in to `wp-admin`.

### 2. Install ACF Pro

**Plugins > Add New Plugin > Upload Plugin**, choose
`advanced-custom-fields-pro.zip`, then **Activate** and enter your license key.

### 3. Turn on debug logging

In LocalWP click **Go to site folder**, open `app/public/wp-config.php`, and
replace the `WP_DEBUG` line with:

```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
```

PHP notices now go to `wp-content/debug.log`, which the workflow checks after
every step.

### 4. Create the theme folder

```text
Local Sites/your-site/app/public/wp-content/themes/your-theme/
```

Leave it empty for now. WordPress will not list it as a theme until
`/wp-theme` creates `style.css`; that is expected.

### 5. Copy the workflow files into the theme folder

Copy these items from this repository into `your-theme/`:

- `AGENTS.md`
- `CLAUDE.md`
- `.claude/` *(hidden folder: enable "Show hidden items" in File Explorer, or
  press `Cmd + Shift + .` in Finder)*
- `blueprint/`

`/onboard` creates the theme's `.gitignore` (which ignores `.env`) for you.

Or from a terminal:

```bash
git clone https://github.com/saidMounaim/figma-wp-blueprint.git
cp -r figma-wp-blueprint/{AGENTS.md,CLAUDE.md,.claude,blueprint} "path/to/themes/your-theme/"
```

### 6. Add your Figma token

1. In Figma: **Settings > Security > Personal access tokens > Generate new
   token**, scope **File content: Read-only**.
2. In `your-theme/`, create a file named `.env`:

   ```env
   FIGMA_TOKEN=figd_your_token_here
   ```

Never paste the token in chat or commit it. `.env` is git-ignored.

### 7. (Optional) Add browser automation

Needed for measured `/pixel-check` and `/check` runs:

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

### 8. Open the theme folder in your editor

Open **`your-theme/`** (not the site root) in VS Code, then start Claude Code
there. The skills only work from this folder.

## Part 2 - Build the theme foundation

Type these commands in the Claude Code chat:

| Step | Command | What happens | What you do |
| --- | --- | --- | --- |
| 9 | `/onboard` | Checks the folder, Git, PHP, ACF Pro, and the Figma token. Sets the theme name, slug, and function prefix. | Answer the questions. Accept `git init`. |
| 10 | `/figma <figma-url>` | Reads the design: colors, fonts, spacing, breakpoints, sections, post types. Saves reference images. Proposes a plan. | Review the section list, answer open questions, approve the plan. |
| 11 | `/overview` | Turns the plan into a numbered, trackable feature list. | Read it. |
| 12 | `/wp-theme` | Writes the spec for feature 1: theme skeleton, tokens, header, footer, page builder. | Approve the spec. |
| 13 | `/implement` | Builds feature 1 on its own Git branch. | In **Appearance > Themes**, activate your theme. Create a test page. |
| 14 | `/pixel-check http://your-site.local/` | Compares the header and footer with Figma at each breakpoint. | Ask for fixes if anything differs. |
| 15 | `/complete` | Archives the feature, then asks before it commits and merges. | Approve. |

Any Figma link works: `design`, `file`, `proto`, or `board`, with or without
`?node-id=`.

## Part 3 - Build pages and post types

Repeat this loop for each item in the build plan:

```text
/feature        spec the next item (for example "Home page sections")
/implement      build each section: ACF fields + PHP + CSS + JS
                -> add the sections to the page in wp-admin with the Figma copy
/pixel-check    compare with Figma at every breakpoint
/check          (optional) prove the spec's done-when criteria in the browser
/audit current  (optional) WordPress security and quality review
/complete       archive, commit, merge
```

`/check` and `/audit` run when you ask for them. To run them automatically, see
[Configuration](#configuration).

After adding a Custom Post Type, go to **Settings > Permalinks** and click
**Save Changes** once.

For a bug or small change outside the plan, use `/fix "<what is wrong>"`, then
`/implement` and `/complete`.

## Commands

All commands are typed in the Claude Code chat, not in a terminal.

### WordPress skills

| Command | Purpose |
| --- | --- |
| `/figma <url>` | Extract tokens, breakpoints, fonts, sections, and CPT candidates from a Figma URL |
| `/wp-theme` | Theme foundation: `functions.php`, `inc/`, enqueue, ACF setup, page builder, header, footer |
| `/section <url or name>` | One Figma section as a Flexible Content layout |
| `/acf <change>` | Create or edit ACF field groups as JSON in `acf-json/` |
| `/cpt <name>` | Custom Post Type with taxonomies, fields, archive, and single templates |
| `/pixel-check <url> [figma-url]` | Measure the local page against Figma and report differences (read-only) |
| `/seo-check [all | <url or slug> | <post-type>]` | Check pages for on-page SEO problems and where to fix them (read-only); asks which pages when run without an argument |

### Workflow skills

| Command | Purpose |
| --- | --- |
| `/onboard` | Set up a new project |
| `/overview` | Generate the project overview from the plans |
| `/feature` | Spec the next build-plan item |
| `/implement` | Build the approved spec |
| `/check` | Verify the feature in the browser (`/check guide` for a manual test guide) |
| `/audit` | Security, performance, and quality review (WordPress rules included) |
| `/complete` | Archive, commit, and merge |
| `/fix "<bug>"` | Spec a bug fix or small change outside the plan |
| `/status` | Where you are and what comes next |
| `/brief`, `/explore`, `/debug` | Read-only help |
| `/rollback` | Plan a safe reversal of a completed feature |
| `/doctor` | Workflow health check |

### Figma helper

All skills use one dependency-free script. You can also run it yourself from
the theme folder:

```bash
node .claude/skills/figma/scripts/figma.mjs check
node .claude/skills/figma/scripts/figma.mjs outline "<figma-url>" --depth 2
node .claude/skills/figma/scripts/figma.mjs tokens  "<figma-url>"
node .claude/skills/figma/scripts/figma.mjs images  "<figma-url>" --out blueprint/reference
```

| Command | What it does |
| --- | --- |
| `check` | Verify the token works |
| `parse <url>` | Show the file key and node id from a URL |
| `outline <url> [--depth N]` | Print the layer tree (default depth 3) |
| `node <url> [--depth N] [--out file]` | Save a simplified JSON tree of the node |
| `tokens <url>` | Aggregate colors, text styles, spacing, radii, and effects |
| `images <url> [--ids a:b,c:d] [--scale 2] [--format png\|jpg\|svg] [--out dir]` | Render nodes as images |
| `fills <url> [--out dir]` | Download the image fills (photos) used inside the node |

API responses are cached in `blueprint/.state/figma/`, which is git-ignored.

## Theme structure

What `/wp-theme`, `/section`, and `/cpt` produce:

```text
your-theme/
├── style.css  functions.php  header.php  footer.php  page.php  index.php
├── inc/
│   ├── setup.php  enqueue.php  acf.php  helpers.php
│   └── post-types/<cpt>.php
├── acf-json/                       ACF field groups (versioned)
├── template-parts/
│   ├── flexible-content.php        renders the page builder
│   ├── sections/<section>.php      one per Flexible Content layout
│   └── components/<name>.php
└── assets/
    ├── css/variables.css           design tokens from Figma
    ├── css/base.css
    ├── css/sections/<section>.css
    ├── css/components/<name>.css
    ├── js/main.js  js/sections/<section>.js
    ├── fonts/                      self-hosted fonts, when the design needs them
    ├── icons/                      SVG icons exported from Figma
    └── images/                     theme images that are not editable content
```

Full conventions: [`blueprint/context/coding-standards.md`](blueprint/context/coding-standards.md).

## Configuration

Workflow behavior is set in [`blueprint/config.json`](blueprint/config.json).
The defaults work for most projects; run `/doctor` after editing it.

| Key | Values (default first) | Effect |
| --- | --- | --- |
| `workflow.stepReview` | `feature`, `every` | Review once per feature, or pause after every build step |
| `workflow.checkpointCommits` | `disabled`, `enabled` | Offer a commit after each approved step |
| `git.landing` | `local-merge`, `pull-request` | How `/complete` offers to land finished work |
| `git.featureBranchPrefix` | `feature/` | Branch prefix (also `fixBranchPrefix`, `rollbackBranchPrefix`) |
| `qualityGates.regular.audit` | `manual`, `when-sensitive`, `always` | When `/audit current` runs automatically |
| `qualityGates.regular.independentReview` | `when-sensitive`, `manual`, `always` | When a fresh-session review is required |
| `qualityGates.regular.check` | `manual`, `when-behavioral`, `always` | When `/check` runs automatically |
| `qualityGates.regular.tryGuide` | `when-testable`, `manual`, `when-user-facing`, `always` | When a "Try it now" guide is written |
| `review.independentExecution` | `automatic`, `manual` | How a selected independent review runs |

Configuration can make review stricter. It never lets the agent commit, merge,
push, or deploy without your approval.

## Deploying the theme

Before launch, run `/seo-check all` and fix its errors.

Deployment is manual. Zip the theme folder **without** the workflow files and
your token:

```bash
cd "path/to/themes"
zip -r your-theme.zip your-theme \
  -x "*/AGENTS.md" "*/CLAUDE.md" "*/.claude/*" "*/blueprint/*" "*/.env" "*/.git/*" "*/.gitignore"
```

On Windows without `zip`, copy the theme folder somewhere else, delete those
items from the copy, then right-click it and choose **Compress to ZIP file**.

Upload the zip in **Appearance > Themes > Add New Theme > Upload Theme**, and make
sure ACF Pro is active on the live site.

## Updating an existing project

To get newer skills in a project that is already running, copy `.claude/`,
`AGENTS.md`, and `CLAUDE.md` from this repository over the ones in your theme
folder, then run `/doctor`.

Do not overwrite `blueprint/`: it holds your plans, coding standards, design
system, and feature history. Compare it with the new version and copy over only
the template files you want.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `No Figma token` | Create `.env` with `FIGMA_TOKEN=...` in the theme folder |
| `403 from Figma` | Token expired, wrong scope, or your Figma account can't view the file |
| `404 from Figma` | Check the URL and that the node still exists in the file |
| `Not a Figma file URL` | Use a `figma.com/design/...`, `file/`, `proto/`, or `board/` link |
| `php: command not found` | In LocalWP, right-click the site > **Open site shell**, and start Claude Code there |
| Skills not found | Open Claude Code in the theme folder, not the site root |
| Theme not listed in WordPress | Normal until `/wp-theme` creates `style.css` |
| CPT pages return 404 | **Settings > Permalinks > Save Changes** |
| "Sync available" in ACF | Normal: the site reads fields from `acf-json/`. Click **Sync** only before editing that group in the admin |
| Something else looks wrong | Run `/doctor` for a workflow health check and repair order |

## Credits

Built on the [AI Blueprint](https://ai-blueprint.dev/docs/getting-started/)
workflow, adapted for Figma-to-WordPress theme development.
