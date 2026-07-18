# Testing RepoBrief

## Commands

Install dependencies:

```bash
npm install
```

Run the full test suite:

```bash
npm test
```

Run TypeScript checking:

```bash
npm run typecheck
```

Build the CLI:

```bash
npm run build
```

Run the CLI from source:

```bash
npm run dev -- scan --root examples/demo-js
```

## What the tests cover

### `tests/scanner.test.ts`

Covers scanner behavior with temporary fixture repos:

- Node package manager detection (`pnpm`)
- TypeScript/JavaScript language detection
- React, Next.js, and Vite framework hints
- command detection from `package.json` scripts
- important folder detection
- existing agent doc detection
- Python package manager detection (`uv`, Poetry)
- FastAPI and Django hints
- Python command hints for pytest, ruff, and mypy
- writing `.agent-context/facts.json`

### `tests/renderer.test.ts`

Covers generated file behavior:

- creates all required agent context files
- includes detected commands and repo map sections
- preserves hand-written content outside managed marker blocks
- replaces only the existing managed block on repeat writes

### `tests/diff.test.ts`

Covers drift comparison:

- ignores `generatedAt`
- reports field-level array additions/removals
- reports command additions such as `commands.build`
- marks facts fresh when only timestamps differ

### `tests/cli.test.ts`

Covers the CLI end-to-end against a temporary repo:

- `scan` writes facts
- `write` generates context files
- `check` exits `0` when fresh
- modifying package scripts creates drift
- `diff` and `check` exit nonzero with a clear summary when stale

## Fixture strategy

Tests create temporary repositories under the OS temp directory. This keeps the repository clean and avoids depending on checked-in fixture output for correctness.

The `examples/demo-js` directory is a human-readable demo repo for manual testing and documentation examples.

## Troubleshooting

### `Cannot find module 'vitest'`

Run:

```bash
npm install
```

### `repobrief check` fails after `repobrief write`

Run:

```bash
repobrief diff
```

If only generated agent docs changed from absent to present, rerun `repobrief write` with the current version. The MVP saves generated agent doc paths as part of facts so subsequent checks stay fresh.

### Windows / WSL notes

Node 20+ is required. The project was verified in WSL with Node 22. If invoking Windows Node from WSL, keep path separators and working directory behavior in mind.
