# RepoBrief architecture

RepoBrief is intentionally small and deterministic. The MVP has no LLM/API dependency and no background service.

## Modules

```text
src/
  cli.ts       command parsing and process exit behavior
  scanner.ts   repo fact discovery and facts.json writing
  writer.ts    target file orchestration
  renderer.ts  markdown/MDC rendering and managed block replacement
  diff.ts      saved-vs-current fact comparison
  util.ts      filesystem helpers, stable JSON, traversal
  types.ts     shared TypeScript interfaces
```

## Data model

The scanner returns a `RepoFacts` object:

```ts
interface RepoFacts {
  schemaVersion: 1;
  generatedAt: string;
  rootName: string;
  packageManagers: string[];
  languages: string[];
  frameworks: string[];
  commands: Partial<Record<'test' | 'lint' | 'typecheck' | 'build', string>>;
  importantFolders: string[];
  existingAgentDocs: string[];
}
```

`generatedAt` is ignored for drift checks. Other fields are compared exactly after deterministic sorting.

## Scanner design

`scanRepo(root)` performs read-only discovery:

1. Traverse files while skipping heavy/generated folders such as `.git`, `node_modules`, `dist`, `build`, `.next`, virtualenvs, and caches.
2. Read root config files when present:
   - `package.json`
   - `pyproject.toml`
   - `requirements.txt`
3. Detect package managers from lockfiles and config.
4. Detect languages from files and config.
5. Detect framework hints from dependencies, config filenames, and well-known files.
6. Detect standard commands from package scripts and Python dependency hints.
7. Detect important top-level folders.
8. Detect existing agent doc files.

The scanner does not execute project commands. This keeps scans fast and safe.

## Renderer and writer design

`renderer.ts` creates deterministic markdown for each target. `writer.ts` decides where it goes.

Human-facing files use managed blocks:

```html
<!-- repobrief:start -->
...
<!-- repobrief:end -->
```

Replacement policy:

- existing file with block: replace only that block
- existing file without block: append a block
- missing file: create with only the block

Generated artifacts under `.agent-context` are overwritten because they are RepoBrief-owned outputs.

## Check and diff design

`check` and `diff` both:

1. read `.agent-context/facts.json`
2. run a fresh scan
3. compare fields except `generatedAt`
4. print a concise drift summary

`check` prints remediation guidance and exits nonzero when stale. `diff` prints only the difference summary and also exits nonzero when differences exist.

## Why no LLM in v1

The MVP solves the highest-leverage context problem with deterministic facts. This keeps it:

- free to run
- safe for private repos
- reproducible in CI
- easy to test
- suitable for open-source adoption

Future optional layers can add summarization or team policy features without changing the core safety model.
