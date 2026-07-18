# RepoBrief usage

RepoBrief has four commands: `scan`, `write`, `check`, and `diff`. All commands default to the current working directory and accept `--root <path>`.

## Scan a repo

```bash
repobrief scan
```

Writes:

```text
.agent-context/facts.json
```

Example:

```bash
repobrief scan --root ~/code/my-app
```

Expected output:

```text
Wrote .agent-context/facts.json for my-app
```

## Generate agent context files

```bash
repobrief write
```

Writes or updates:

```text
AGENTS.md
CLAUDE.md
.cursor/rules/project.mdc
.github/copilot-instructions.md
.agent-context/repo-map.md
.agent-context/facts.json
```

Run this after changing package managers, scripts, framework dependencies, or important folder layout.

## Preserve existing docs

If `AGENTS.md` already contains hand-written notes:

```markdown
# Project rules

Use small PRs.
```

RepoBrief appends a managed block instead of replacing the file:

```markdown
# Project rules

Use small PRs.

<!-- repobrief:start -->
# RepoBrief Context
...
<!-- repobrief:end -->
```

On the next write, only the managed block changes.

## Check for drift

```bash
repobrief check
```

Fresh output:

```text
RepoBrief facts are fresh.
```

Stale output example:

```text
RepoBrief facts are stale. Run `repobrief write` to refresh.

RepoBrief drift detected:
- commands.build:
  + npm run build
- frameworks:
  + Vite
```

Exit codes:

- `0`: saved facts match current scan
- `1`: missing facts file, stale facts, or runtime error
- `2`: invalid command/arguments

## Show differences without writing

```bash
repobrief diff
```

This is useful before deciding whether to run `repobrief write`.

## Running from source

During development:

```bash
npm install
npm run dev -- scan --root examples/demo-js
npm run dev -- write --root examples/demo-js
npm run dev -- check --root examples/demo-js
```

After build:

```bash
npm run build
node dist/cli.js write --root examples/demo-js
```

## Recommended workflow

For a new project:

```bash
repobrief write
git add AGENTS.md CLAUDE.md .cursor/rules/project.mdc .github/copilot-instructions.md .agent-context
```

For ongoing maintenance:

```bash
repobrief check || repobrief diff
repobrief write
```

For CI:

```bash
repobrief check
```

If CI fails, run `repobrief write` locally and commit the refreshed files.
