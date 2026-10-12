# AGENTS.md

Instructions for AI coding agents working in **wp-ai-workflow** projects.
Claude Code reads `CLAUDE.md`, which imports this file, so there is a single
source of truth.

Do not add AI attribution to commits or pull requests, including AI
`Co-Authored-By` trailers or generated-by signatures. Preserve genuine human
attribution. See
[Commit and PR attribution](blueprint/context/ai-interaction.md#commit-and-pr-attribution)
for optional tool settings.

## What this is

**wp-ai-workflow** turns a Figma design into a pixel-perfect custom WordPress
theme:

- **Design:** Figma URLs, read through the Figma REST API by a local helper
  script (no MCP server needed)
- **Theme:** classic PHP theme, no page builder
- **Fields:** ACF Pro (Flexible Content page builder, options page, CPT fields)
- **Content types:** Custom Post Types and taxonomies registered in the theme
- **Styling:** pure CSS with custom properties extracted from Figma
- **Behavior:** vanilla JavaScript, no jQuery
- **Local environment:** LocalWP

It is built on the AI Blueprint workflow layer: one feature at a time, behind
review gates, with every spec archived under `blueprint/history/`.

The Git repository root is the theme folder inside the LocalWP site
(`app/public/wp-content/themes/<theme-slug>/`). Copy these workflow files
(`AGENTS.md`, `CLAUDE.md`, `.claude/`, `blueprint/`) into that folder, then run
`/onboard`. Exclude them from the production theme upload (see Commands).

## Proportional engineering

Build for established requirements, not hypothetical scale, threats, or future
flexibility. Reuse existing code, WordPress core APIs, ACF features, and native
browser features before adding machinery.

- Unknown scale or extensibility defaults to the smaller reversible design. Do
  not infer enterprise, multi-tenant, hostile-user, or compliance requirements.
- Derive trust and data-integrity boundaries from actual reachability: forms,
  AJAX and REST handlers, user input, capabilities, nonces, destructive
  operations, payments, secrets, and sensitive data.
- Ask only when an unknown materially changes behavior, content structure,
  persisted data, a real security boundary, or cost. Otherwise choose the
  simplest WordPress-native implementation.
- Add a plugin, library, abstraction, or configuration surface only for a current
  requirement.
- Simplicity never removes escaping, sanitizing, nonces, accessibility, explicit
  security requirements, or project rules.

## Read these when relevant

- `blueprint/config.json` - deterministic project workflow settings
- `blueprint/context/project-overview.md` - the project's source of truth
- `blueprint/context/coding-standards.md` - read before changing code
- `blueprint/context/ai-interaction.md` - read when running the workflow
- `blueprint/context/current-feature.md` - the one feature, fix, or rollback being built
- `blueprint/design/design-system.md` - Figma tokens, breakpoints, and the section
  inventory, written by `/figma`

Reuse relevant context already loaded in the session. Skills load these files on
demand.

## Project configuration

`blueprint/config.json` is the user-owned, machine-readable workflow policy.
Workflow skills read the relevant settings before acting. A missing file means
built-in defaults. An invalid file falls back to defaults for read-only status
reporting, but mutating workflow commands stop and point to `/doctor`.

Configuration can make review or verification stricter and can tune branch
names. It never grants permission to commit, merge, push, deploy, publish, send,
delete data, waive a failing check, or accept a finding.

`qualityGates.regular` controls automatic audit, independent-review, check, and
try-guide behavior. Independent review defaults to `when-sensitive`; audit and
check default to `manual`; try guide defaults to `when-testable`.
`review.independentExecution` (`automatic` or `manual`) controls how a selected
independent review runs. `git.landing` (`local-merge` or `pull-request`) controls
how `/complete` offers to land finished work. `workflow.stepReview` (`feature`
or `every`) and `workflow.checkpointCommits` (`disabled` or `enabled`) control
review pauses during `/implement`.

## Workflow

Build one feature, fix, or rollback at a time, behind review gates. Skills live
in `.claude/skills/<skill>/SKILL.md` and are invoked as slash commands in Claude
Code (`/figma`, `/feature`, and so on). They are AI chat commands, not terminal
commands.

### The Figma-to-WordPress path

```text
/onboard  ->  /figma <url>  ->  plans  ->  /overview  ->  /wp-theme
(setup)       (tokens +         (you)      (context)      (theme skeleton,
               sections)                                    first feature)

then per feature:
/feature  ->  /implement  ->  /pixel-check  ->  /check  ->  /audit current  ->  /complete
(spec)        (uses /section,   (vs Figma)      (behavior)   (WP security +     (archive +
               /acf, /cpt)                                     quality)          commit)
```

1. `/onboard` confirms LocalWP, the theme folder, ACF Pro, and the Figma token,
   then fills in project identity and commands.
2. `/figma <url>` reads the design and writes `blueprint/design/design-system.md`
   (tokens, breakpoints, fonts, section inventory, CPT candidates) plus reference
   screenshots. It proposes the build plan.
3. You review `blueprint/project-plan.md` and `blueprint/build-plan.md`, then run
   `/overview`.
4. Feature 1 is normally `/wp-theme`: the theme skeleton, tokens, header, footer,
   and the Flexible Content page builder.
5. Each later feature is a page, a set of sections, or a CPT. `/implement` uses
   the `/section`, `/acf`, and `/cpt` recipes for those steps.
6. `/pixel-check` compares the built page with Figma at every breakpoint before
   `/complete`.

### Skills

#### WordPress

- `figma` - read a Figma URL (design, file, or proto link), extract design tokens,
  breakpoints, fonts, assets, and a section inventory into
  `blueprint/design/`, and propose build-plan items
- `wp-theme` - scaffold the classic theme skeleton: `style.css`, `functions.php`,
  `inc/`, enqueue, ACF setup, page builder loop, header, footer, base CSS
- `section` - build one Figma section as a Flexible Content layout: ACF clone
  group, template part, scoped CSS, and optional vanilla JS
- `acf` - create or change ACF field groups as local JSON in `acf-json/`
- `cpt` - register a Custom Post Type with its taxonomies, templates, and fields
- `pixel-check` - compare the rendered LocalWP page with the Figma frame at each
  breakpoint and report measured differences, read-only

#### Build

- `feature` - turn a build-plan item into a spec, or propose a plan addition
- `implement` - build the current spec one small, reviewed step at a time
- `check` - prove the current spec against the running site, or use `check guide`
  for a read-only manual review guide
- `complete` - final safety pass, archive under `blueprint/history/`, then request
  approval for the configured landing

#### Understand and review

- `explore` - investigate an idea against the actual code without writing files
- `brief` - read-only briefing on an upcoming build-plan feature
- `status` - read-only progress summary and suggested next action
- `debug` - reproduce and isolate a failure without editing code
- `audit` - review across quality, security, performance, or tests lenses, with
  WordPress escaping, nonce, sanitizing, and query checks; records findings in
  `blueprint/context/findings.md`; `audit independent current` prepares a fresh
  reviewer checkpoint
- `doctor` - workflow health check

#### Plan, recover

- `onboard` - set up a new theme project after copying the workflow files
- `overview` - distill the two planning docs into `blueprint/context/project-overview.md`
- `fix` - document an ad-hoc bug or change into `blueprint/context/current-feature.md`
- `rollback` - plan a safe reversal of a completed feature

## Dashboard activity

The dashboard can show the active or most recent substantial command from
`blueprint/.state/run.json`. This file is generated local state, ignored by Git,
and never part of a feature commit.

Commands with meaningful progress should write it when the state directory
exists: `onboard`, `overview`, `figma`, `wp-theme`, `feature`, `fix`,
`rollback`, `implement`, `debug`, `check`, `audit`, and `complete`. Short
orientation and recipe commands (`explore`, `brief`, `status`, `doctor`,
`section`, `acf`, `cpt`, `pixel-check`, and `check guide`) do not write activity
state.

Writing the initial activity record is the first action of a tracked command.
Never create or edit `run.json` directly. From the project root, use:

```text
node .claude/skills/doctor/scripts/run-state.mjs <action> <options>
```

Start with `start --command <skill> --summary <truthful-summary> --boundary
<boundary>`. Use `update` at milestones or for a blocker, with
`--status blocked` and `--resume <exact-command>` when recovery is needed. End
with `finish --status ready|completed --summary <truthful-summary>`. If the
helper is missing or fails, report the activity warning and continue without a
manual fallback.

`status` must be `running`, `blocked`, `ready`, or `completed`. `boundary` must
be `read-only`, `reviewed`, or `local-only`. Never put secrets, raw logs, prompts,
or user content in this file. Activity tracking never changes approval
boundaries.

## Required tools

- **LocalWP** with the site running and `WP_DEBUG`, `WP_DEBUG_LOG`, and
  `WP_DEBUG_DISPLAY` set in `wp-config.php` for local development
- **ACF Pro** installed and active on the local site
- **Figma personal access token** (one-time): figma.com > Settings > Security >
  Personal access tokens, scope **File content: read-only**. Put it in `.env` at
  the theme root as `FIGMA_TOKEN=...` (`.env` is git-ignored). After that, every
  skill takes plain Figma URLs. The helper is
  `node .claude/skills/figma/scripts/figma.mjs` (Node 18+, no dependencies);
  run it with `check` to test the token. The Figma account that owns the token
  needs view access to the file.
- **Browser automation** for `/pixel-check` and `/check`, such as the Playwright
  MCP server: `claude mcp add playwright -- npx @playwright/mcp@latest`
- **Node.js 18+** for the Figma and activity helper scripts
- **PHP CLI** on `PATH` for `php -l` (use LocalWP's **Open site shell** if the
  system has no PHP)

## Commands

Set by `/onboard` for the real site. Defaults:

- Local site: `http://<site>.local` (start it from the LocalWP app)
- Admin: `http://<site>.local/wp-admin`
- Debug log: `../../debug.log` (relative to the theme folder)
- Verify: `find . -name "*.php" -not -path "./vendor/*" -not -path "./node_modules/*" -print0 | xargs -0 -n1 php -l | grep -v "No syntax errors"; for f in acf-json/*.json; do php -r "json_decode(file_get_contents('$f')); exit(json_last_error() ? 1 : 0);" || echo "Invalid JSON: $f"; done`
  (passes when it prints nothing)
- Package theme: zip the theme folder excluding `AGENTS.md`, `CLAUDE.md`,
  `.claude/`, `blueprint/`, and `.git/`

There is no unit test runner and no build step. See the Testing section of
`blueprint/context/coding-standards.md` for the evidence each step needs.
