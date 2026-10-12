---
name: onboard
description: Set up a new wp-ai-workflow theme project after copying the workflow files into a LocalWP theme folder - confirm Git, LocalWP site, theme identity, ACF Pro, Figma token, browser automation, PHP CLI, commands, and review preferences. Use for /onboard or what to do after installing the workflow.
disable-model-invocation: true
---

# onboard - set up a new theme project

**Context reuse:** Reuse any required file already loaded in project instructions or the current session. Read it again only if absent, changed, or exact current bytes or line references are needed.

**First action:** Before project inspection, preflight, or any other tool call,
publish `running` to `blueprint/.state/run.json` using the dashboard activity
contract in `AGENTS.md`.

Where this sits in the workflow:

    LocalWP site  ->  copy workflow files  ->  [onboard]  ->  /figma <url>  ->  /overview
    (user)            into the theme folder     (tune setup)

## Input

None required. Use any site name, theme name, or Figma URL the user gives as a
hint and verify it.

## Step 0 - location and Git

1. Confirm the working directory is a theme folder inside a LocalWP site: the
   path looks like `.../app/public/wp-content/themes/<slug>/` and
   `../../../wp-config.php` exists. If the directory is elsewhere, stop and tell
   the user to create the site in LocalWP, create
   `app/public/wp-content/themes/<theme-slug>/`, copy `AGENTS.md`, `CLAUDE.md`,
   `.claude/`, and `blueprint/` into it, and reopen Claude Code there.
2. Confirm Git (`git rev-parse --is-inside-work-tree`). If it is not a repo, ask
   once: `Initialize Git in the theme folder? (Recommended)`. On yes run
   `git init -b main`. If `HEAD` is unborn, offer one commit of the workflow files
   as `chore: add wp-ai-workflow` after showing the file list. Never commit
   without approval and never push.

## Step 1 - project identity

Ask only for what you cannot detect:

- **Theme name** (human readable) and **theme slug** (folder name, used as text
  domain)
- **Function prefix** - short, lowercase, underscore-safe, derived from the slug
  (`acme-studio` -> `acme`). Confirm it.
- **Local URL** - from the LocalWP site domain (`<site>.local`)

Write these into the Project identity section of
`blueprint/context/coding-standards.md` (replacing the `<theme-slug>`,
`<prefix>_`, and `http://<site>.local` placeholders) and the Commands section of
`AGENTS.md`.

## Step 2 - environment checks

Check each and report a table of `ok`, `missing`, or `ask user`:

| Check | How |
| --- | --- |
| PHP CLI | `php -v`. If missing, tell the user to run Claude Code from LocalWP's **Open site shell**, or add LocalWP's PHP to `PATH`. |
| `WP_DEBUG` | read `wp-config.php`: `WP_DEBUG`, `WP_DEBUG_LOG` true locally; suggest `WP_DEBUG_DISPLAY` false so notices go to `wp-content/debug.log`. Show the lines; edit only with approval. |
| ACF Pro | `wp-content/plugins/advanced-custom-fields-pro/` exists. Active state needs the user or WP-CLI (`wp plugin list` in the site shell). |
| Figma token | `node .claude/skills/figma/scripts/figma.mjs check`. If missing: create a personal access token at figma.com > Settings > Security (scope: file content, read-only) and have the user add `FIGMA_TOKEN=...` to `.env` themselves. Never ask them to paste the token in chat. |
| Browser automation | a browser MCP (for example Playwright) is available. If not: `claude mcp add playwright -- npx @playwright/mcp@latest`. Needed by `/pixel-check` and `/check`. |
| Site loads | fetch the local URL; if it fails, ask the user to start the site in LocalWP. |

Never install plugins or MCP servers yourself; give the exact command.

## Step 3 - commands

Update the Commands section of `AGENTS.md` with the real local URL, admin URL,
debug log path, and confirm the `Verify` command runs in this shell (it needs
`php`, `find`, and `xargs`; in PowerShell-only environments rewrite it as an
equivalent PowerShell command and test it). A `Verify` run on a folder with no
PHP yet passes by printing nothing.

## Step 4 - ignore rules

Create or update `.gitignore` in the theme folder, preserving entries:

```gitignore
.DS_Store
Thumbs.db
node_modules/
vendor/
*.log
.env
blueprint/.state/run.json
blueprint/.state/figma/
```

Ask whether the workflow files are committed with the theme (recommended for
teams) or kept local. For local-only, also ignore `.claude/`, `blueprint/`,
`CLAUDE.md`, and `AGENTS.md`.

## Step 5 - review style and gates

Read `blueprint/config.json` (invalid -> stop and show the key). Ask one
**Implementation style** question unless already chosen:

1. **Efficient (Recommended)** - one review packet per feature:
   `workflow.stepReview: "feature"`, `workflow.checkpointCommits: "disabled"`.
2. **Guided** - pause after every step with optional checkpoint commits:
   `"every"` and `"enabled"`.

Mention, without asking, that `qualityGates.regular.check` can be set to
`always` to require a browser check of every feature, and `audit` to
`when-sensitive` to audit forms and handlers automatically.

## Step 6 - hand off

Report: theme identity, environment table, files changed, config choices,
anything still missing. Then the next command:

```text
/figma <figma file or frame URL>
```

## Rules

- Never install WordPress, plugins, starter themes, or npm packages.
- Never edit `wp-config.php` or anything outside the theme folder without
  explicit approval for that exact change.
- Planning docs are user-owned; onboarding only touches setup files.
- Never commit without approval; never push.

## Formatting

Format the output to match the project's conventions in
`blueprint/context/ai-interaction.md`.
