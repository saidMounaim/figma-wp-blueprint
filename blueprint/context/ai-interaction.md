# AI Interaction Guidelines

> **wp-ai-workflow lives inside the theme folder** of a LocalWP site
> (`app/public/wp-content/themes/<theme-slug>/`). The theme skeleton itself is
> created by `/wp-theme`; never install starter themes or page builders over it.

## Communication

- Be concise and direct
- Explain non-obvious decisions briefly
- Ask before large refactors or architectural changes
- Don't add features not in the project spec
- Never delete files without clarification

## Output formatting

Format every response for fast scanning, in whatever tool renders it. The skills
point at this file for formatting, so tune this to taste and the change applies
everywhere.

- **Real markdown, not prose walls** - bold field labels, short lines, a blank line between blocks.
- **Enumerations are lists** - a sequence of steps, options, or findings is a numbered or bulleted list, never an inline `(1)... (2)... (3)...` run crammed into a paragraph.
- **Tables for matrices** - comparing things across the same fields (status per item, option tradeoffs) goes in a table, not stacked bullets.
- **Backticks for code things** - identifiers, paths, commands, filenames.
- **Lead with the answer** - state the result or the state first, supporting detail after.
- **Don't over-format** - no deep bullet nests or decorative headers on a two-line reply. Concise still wins.

## Workflow

The loop we use for every feature. The spec for the feature being built lives in
@blueprint/context/current-feature.md.

Run `/feature` (or `/fix` for a bug or change that isn't a planned feature) to
write the spec and approve it before `/implement` builds it on a branch. Use
`/check` to prove behavior, `/audit` to review code and record findings, and
`/complete` to log the work and merge with approval. This teaching path does not
change the configured gates; Audit is not mandatory for every feature.
`/check guide` only explains how the user can test the work and never runs checks
or records acceptance. The numbered loop below is what those skills follow.

Before planning, `/explore <topic>` investigates an idea against the actual code
without requiring plans or writing files. `/brief` instead explains an existing
build-plan item. Run these skills in Claude Code chat as slash commands, not as
terminal commands.

After the first successful `/overview`, Blueprint offers a reviewed local commit
for the initial workflow setup and plans before Feature 1. It shows the exact
candidate diff and asks first. It skips local-only installations and stops
rather than mixing app source or unrelated work into the baseline. When setup
work is on a dedicated branch, the same approval can finalize the local baseline
and fast-forward it into the unchanged default branch. It never pushes.

The skills are the structured path, not a requirement. You can also just describe
a feature, fix, or change in chat at any time and we'll build it the same way; the
rules below still apply (small steps, a reviewable diff, the conventions in
`coding-standards.md`). Project instructions tell the agent to read these files
when the work needs them instead of carrying them through every unrelated turn.
Use the skills when you want the repeatable loop and the logging; prompt directly
when you just want something done.

1. **Spec** - Optionally run `/brief` first for a read-only preview of the next
   feature (scope, dependencies, size); it writes nothing. Then run `/feature`
   (no number = the next unchecked item in `build-plan.md`) to generate
   @blueprint/context/current-feature.md, then review it together before any code.
2. **Branch** - Create a new branch for the feature/fix.
3. **Implement** - Build one small step from the spec at a time, not the whole
   feature as one undifferentiated change.
4. **Review** - By default, implement and verify each small step, then show one
   feature-level review packet with the complete diff and done-when evidence.
   Set `workflow.stepReview` to `every` when I should approve each step before
   the next one begins. After the final packet, `/implement` always offers a
   read-only walkthrough of the finished code, regardless of review cadence or
   checkpoint settings.
5. **Test** - Verify the done-when with evidence. Run the exact `Verify` command
   from `AGENTS.md` (PHP lint plus ACF JSON validity) as the final automated gate.
   Load the page in the LocalWP site and confirm no PHP notices in the debug log
   and no browser console errors. Visual steps need `/pixel-check` against the
   Figma frame at every designed breakpoint. See the Testing and Pixel-perfect
   sections of `coding-standards.md`.
6. **Try it now** - After Verify and any required `/check` pass, the default
   `when-testable` guide policy adds one small user-run command or interaction
   with the exact expected result whenever a safe meaningful path exists. Run
   `/check guide` explicitly for a deeper human walkthrough. `/check` proves
   behavior from the agent side; Try It Now is a user demonstration and never
   replaces tests, Verify, or Check.
7. **Audit (optional)** - Run `/audit` when you want a read-only code quality pass
   before closing a feature or after a larger automated run. It checks for
   duplication, dead code, missing tests for logic, standards drift, and
   maintainability risks. Run `/audit independent current` when a selected fresh
   reviewer should inspect an approved checkpoint and leave a staleness-checked
   receipt. Regular and Continuous independent review default to
   `when-sensitive`, so sensitive or unusually broad work selects this gate
   automatically while ordinary small features do not. A `manual` gate policy
   disables automatic selection, but the explicit command remains available.
   `review.independentExecution` defaults to an automatic isolated reviewer when
   supported; set it to `manual` for the fresh-session handoff. Fixes still
   happen through `/implement` or `/fix`.
8. **Iterate** - If it doesn't work or needs changes, re-prompt or hand-edit and
   re-test; repeat until it works, before moving on.
9. **Checkpoint (optional)** - checkpoint commits are disabled by default. When
   enabled with per-step review, `/implement` offers continue, commit a
   checkpoint, walk me through it, or stop here after an approved step. The
   checkpoints are optional rollback points; `/complete` still makes the real
   feature-level commit. Verify, or the fallback checks, must pass first. When
   implementation is done, end with a compact review packet: changed files,
   checks run, the generated `## Try it now` section when applicable, risks, and
   next action. The per-step walkthrough
   is part of the Guided checkpoint prompt. The final code walkthrough is always
   available and is separate from the manual product-review path produced by
   `/check guide`.

`workflow.stepReview: "every"` restores per-step approval pauses but does not
enable checkpoint prompts by itself. The previous workflow uses
`stepReview: "every"` together with `checkpointCommits: "enabled"`.
10. **Safety + log** - `/complete` first checks the active spec, branch, changed
   files, Verify or fallback check evidence, manual try path, and adapter sync when
   workflow files changed. Then it archives the spec using its frozen build attempt:
   `blueprint/history/features/NN-name.md` for the first build and
   `NN-name--build-N.md` for rebuilds, preserving earlier archives and the stable
   plan ID (fixes use `blueprint/history/fixes/`). It checks the feature off in
   `blueprint/build-plan.md`, and
   resets `blueprint/context/current-feature.md` and
   `blueprint/context/review.md` to their stubs.
11. **Feature commit** - `/complete` stages everything on the branch (step work
   plus the logging changes) into one conventional feature commit.
12. **Land** - `/complete` follows `git.landing`. The default local path asks to
    squash-merge the branch and later asks separately before pushing the default
    branch. The `pull-request` path asks once before pushing the work branch and
    opening a pull request, then leaves provider review and squash merge to the
    user. Neither path infers approval from configuration.

Deploying the theme to staging or production is a manual step outside this
workflow. Never upload, sync, or push to a remote server without a separate yes
in the current chat.

**Resuming after a context clear.** Progress lives in files, not the chat:
`current-feature.md` holds the spec with each step checked off as it's done, and git
holds the code (branch, commits, working tree). A fresh `/implement` or
`$implement` run loads `current-feature.md` on demand and continues from the
first unchecked step, so no separate save or load command is needed.

Do NOT commit without permission or until Verify, or the fallback build and tests,
passes. If a required check fails, fix the issue first.

## Branching

A new branch for every feature, fix, or rollback, using the prefixes in
`blueprint/config.json`. Ask to delete the branch once merged.

## Commits

- Ask before committing
- The initial Overview baseline also requires explicit approval and uses
  `chore: establish Blueprint project baseline`
- Use conventional commit messages (feat:, fix:, chore:, etc.)
- Keep commits focused (one feature/fix per commit)
- Do not add AI `Co-Authored-By` trailers, generated-by signatures, or other AI
  attribution to commits or pull requests; preserve genuine human attribution

### Commit and PR attribution

Claude Code supports optional [attribution settings](https://code.claude.com/docs/en/settings-reference#attribution).
Merge these keys into `.claude/settings.json` for the project or
`~/.claude/settings.json` for [personal global settings](https://code.claude.com/docs/en/settings),
preserving all other settings in the existing JSON:

```json
{
  "attribution": {
    "commit": "",
    "pr": "",
    "sessionUrl": false
  }
}
```

Empty strings suppress the default commit trailer and PR attribution text.
`sessionUrl: false` also omits session links from cloud and Remote Control
commits and PRs. The older `includeCoAuthoredBy` setting is deprecated.

Older Codex advice to set `commit_attribution = ""` is outdated: current Codex
[no longer supports that TOML key](https://github.com/openai/codex/commit/d18a7c982e4abad5bf549cda6f4b61a18c10702e).

These settings are optional; the installer does not change your tool
configuration. Guidance and settings reduce unwanted attribution but do not
enforce commit or PR message contents. Review the final text before submitting it.

## When Stuck

- If something isn't working after 2-3 attempts, stop and explain the issue
- Don't keep trying random fixes
- Ask for clarification if requirements are unclear

## Code Changes

- Make minimal changes to accomplish the task
- Don't refactor unrelated code unless asked
- Don't add "nice to have" features
- Preserve existing patterns in the codebase
- For visual work, build from the Figma node itself through
  `.claude/skills/figma/scripts/figma.mjs` (`node` for measurements, `images`
  for the target render) and the tokens in `blueprint/design/design-system.md`,
  never from a prose description. Ask for the Figma URL if it's missing.
- Never print, log, or commit the Figma token in `.env`.
- Never edit WordPress core, plugin files, or the database schema. Content
  structure changes go through ACF JSON and CPT registration.

## Code Review

Review AI-generated code periodically, especially for:

- Security (escaping at output, nonces, sanitizing, capability checks)
- Performance (unbounded `WP_Query`, queries in loops, unoptimized images)
- Logic errors (empty ACF fields, missing fallbacks)
- Patterns (matches the coding standards and existing sections?)
