# RepoBrief

One command to keep AI coding agents aligned with your repo.

RepoBrief is a free, open-source TypeScript CLI that scans a codebase and generates durable context files for Claude Code, Codex, Cursor, GitHub Copilot, OpenCode, Gemini CLI, and other AI coding agents. It is intentionally offline-first: no LLM calls, no API keys, and no source upload.

## Why it exists

AI coding agents work better when the repo tells them the same facts every time:

- what package manager to use
- which frameworks are present
- where important folders live
- how to run tests, lint, typecheck, and build
- where existing agent instructions already live

Without that context, every agent session starts by rediscovering the basics. RepoBrief turns those basics into maintained, agent-readable files.

## Install and local development

The GitHub repo is public. The unscoped npm name `repobrief` is already taken by another package, so npm publishing should use a scoped name such as `@fadythebassist/repobrief` unless the package name becomes available.

For local development today:

```bash
git clone https://github.com/fadythebassist/repobrief.git
cd repobrief
npm install
npm run build
npm run dev -- scan --root /path/to/your/repo
```

After build, you can run the compiled CLI directly:

```bash
node dist/cli.js scan --root /path/to/your/repo
node dist/cli.js write --root /path/to/your/repo
```

Future npm usage, after publishing under a confirmed package name, should look like:

```bash
npx @fadythebassist/repobrief write
```

## Quick start

From a repository root:

```bash
repobrief scan
repobrief write
repobrief check
```

Or scan a different path:

```bash
repobrief write --root ../my-app
```

## Before / after

Before:

```text
my-app/
  package.json
  src/
  tests/
```

After `repobrief write`:

```text
my-app/
  AGENTS.md
  CLAUDE.md
  .cursor/rules/project.mdc
  .github/copilot-instructions.md
  .agent-context/facts.json
  .agent-context/repo-map.md
  package.json
  src/
  tests/
```

The generated agent docs include a managed section with stack hints, commands, important folders, and links back to the facts file. Existing human-written content is preserved outside RepoBrief markers.

## CLI reference

### `repobrief scan`

Scans the current repo and writes `.agent-context/facts.json`.

```bash
repobrief scan
repobrief scan --root /path/to/repo
```

### `repobrief write`

Runs a scan and writes/updates all supported context files:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/project.mdc`
- `.github/copilot-instructions.md`
- `.agent-context/repo-map.md`
- `.agent-context/facts.json`

```bash
repobrief write
```

### `repobrief check`

Re-runs the scanner and compares current facts to `.agent-context/facts.json`.

- exits `0` when facts are fresh
- exits nonzero when facts drifted
- prints a clear summary of changed fields

```bash
repobrief check
```

Useful in CI to keep generated context files updated.

### `repobrief diff`

Shows current-vs-saved fact differences without writing files.

```bash
repobrief diff
```

## Supported detections in the MVP

Package managers:

- npm (`package.json`, `package-lock.json`)
- pnpm (`pnpm-lock.yaml`)
- yarn (`yarn.lock`)
- bun (`bun.lock`, `bun.lockb`)
- uv (`uv.lock`, `[tool.uv]`)
- Poetry (`poetry.lock`, `[tool.poetry]`)
- pip requirements (`requirements.txt`)

Languages and framework hints:

- TypeScript / JavaScript
- Python
- React
- Next.js
- Vite
- FastAPI
- Django
- generic fallback

Commands:

- Node scripts: `test`, `lint`, `typecheck`, `build`
- Python hints: `pytest`, `ruff check .`, `mypy .` when dependencies/config are detected

Folders:

- `src`, `app`, `pages`, `api`, `tests`, `test`, `__tests__`, `scripts`, `docs`, `lib`, `packages`, `components`, `server`

Existing agent docs:

- `AGENTS.md`
- `CLAUDE.md`
- `.cursor/rules/project.mdc`
- `.github/copilot-instructions.md`

## Safety model

RepoBrief uses managed marker blocks in human-facing docs:

```html
<!-- repobrief:start -->
...generated content...
<!-- repobrief:end -->
```

Rules:

- If a file does not exist, RepoBrief creates it.
- If a file exists with markers, RepoBrief replaces only the marked block.
- If a file exists without markers, RepoBrief appends a managed block and preserves the existing content.
- `.agent-context/repo-map.md` and `.agent-context/facts.json` are generated artifacts and can be regenerated.
- RepoBrief never calls an LLM or uploads source code.

## CI usage

Example GitHub Actions step after installing dependencies:

```yaml
- name: Verify RepoBrief context is fresh
  run: |
    npm install -g repobrief
    repobrief check
```

For this repo during development:

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev -- check
```

## Limitations

- Detection is heuristic, not a full build-system parser.
- Monorepo support is currently shallow; it detects top-level package/config files and important folders.
- Python command detection is dependency/config based and does not execute environment discovery.
- Generated docs are intentionally concise and deterministic; v1 has no LLM summarization.

## Roadmap

- richer monorepo/package workspace detection
- more ecosystems: Go, Rust, Java, .NET, Ruby
- configurable output targets
- repo-specific ignore/include rules
- markdown templates
- pre-commit and CI helpers
- optional paid/open-core features for teams, policy packs, dashboards, and hosted drift monitoring

## Open-core notes

RepoBrief's core scanner, renderer, and CLI are designed to stay useful as a free/open-source developer tool. Monetization-friendly extensions can live around the core without locking basic context generation behind a service:

- team policy packs
- organization templates
- hosted context drift dashboards
- scheduled PRs to refresh generated docs
- private registry/distribution support

## Development commands

```bash
npm install
npm test
npm run typecheck
npm run build
npm run dev -- scan
```

See also:

- `docs/USAGE.md`
- `docs/TESTING.md`
- `docs/ARCHITECTURE.md`
