import { afterEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cleanup, makeTempRepo, writeText } from './helpers.js';
import { scanRepo, writeFacts } from '../src/scanner.js';

let root: string | undefined;
afterEach(async () => {
  if (root) await cleanup(root);
  root = undefined;
});

describe('scanRepo', () => {
  it('detects Node package manager, frameworks, scripts, folders, and existing agent docs', async () => {
    root = await makeTempRepo();
    await writeText(root, 'pnpm-lock.yaml', 'lockfileVersion: 9\n');
    await writeText(root, 'package.json', JSON.stringify({
      scripts: { test: 'vitest run', lint: 'eslint .', typecheck: 'tsc --noEmit', build: 'next build' },
      dependencies: { next: '^15.0.0', react: '^19.0.0' },
      devDependencies: { vite: '^6.0.0', typescript: '^5.7.0' }
    }, null, 2));
    await writeText(root, 'src/index.ts', 'export const x: number = 1;\n');
    await writeText(root, 'app/page.tsx', 'export default function Page() { return null; }\n');
    await writeText(root, 'tests/basic.test.ts', 'test("x", () => {});\n');
    await writeText(root, 'AGENTS.md', '# Existing\n');
    await writeText(root, '.cursor/rules/project.mdc', '---\n');

    const facts = await scanRepo(root);

    expect(facts.rootName).toBeTruthy();
    expect(facts.packageManagers).toEqual(['pnpm']);
    expect(facts.languages).toEqual(expect.arrayContaining(['TypeScript', 'JavaScript']));
    expect(facts.frameworks).toEqual(expect.arrayContaining(['Next.js', 'React', 'Vite']));
    expect(facts.commands).toMatchObject({
      test: 'pnpm test',
      lint: 'pnpm lint',
      typecheck: 'pnpm typecheck',
      build: 'pnpm build'
    });
    expect(facts.importantFolders).toEqual(expect.arrayContaining(['app', 'src', 'tests']));
    expect(facts.existingAgentDocs).toEqual(expect.arrayContaining(['AGENTS.md', '.cursor/rules/project.mdc']));
  });

  it('detects uv, poetry-style Python projects and writes facts.json', async () => {
    root = await makeTempRepo();
    await writeText(root, 'uv.lock', 'version = 1\n');
    await writeText(root, 'pyproject.toml', '[project]\ndependencies = ["fastapi", "django", "pytest", "ruff", "mypy"]\n[tool.poetry]\nname = "demo"\n');
    await writeText(root, 'api/main.py', 'from fastapi import FastAPI\n');
    await writeText(root, 'docs/guide.md', '# Guide\n');

    const facts = await scanRepo(root);
    await writeFacts(root, facts);
    const saved = JSON.parse(await readFile(join(root, '.agent-context/facts.json'), 'utf8'));

    expect(facts.packageManagers).toEqual(expect.arrayContaining(['uv', 'poetry']));
    expect(facts.languages).toContain('Python');
    expect(facts.frameworks).toEqual(expect.arrayContaining(['FastAPI', 'Django']));
    expect(facts.commands.test).toBe('uv run pytest');
    expect(facts.commands.lint).toBe('uv run ruff check .');
    expect(facts.commands.typecheck).toBe('uv run mypy .');
    expect(saved.schemaVersion).toBe(1);
  });
  it('detects Astro via config file even without the Astro dependency declared', async () => {
    root = await makeTempRepo();
    await writeText(root, 'astro.config.mjs', 'export default {};\n');
    
    const facts = await scanRepo(root);
  
    expect(facts.frameworks).toContain('Astro');
  });
  it('detects Astro via dependency even without a config file', async () => {
    root = await makeTempRepo();
    await writeText(root, 'package.json', JSON.stringify({ dependencies: { astro: '^5.0.0' } }, null, 2));
  
    const facts = await scanRepo(root);

    expect(facts.frameworks).toContain('Astro');
  });
  it('detects Rust/Cargo via Cargo.toml', async () => {
    root = await makeTempRepo();
    await writeText(root, 'Cargo.toml', '[package]\nname = "demo"\nversion = "0.1.0"\n');
    
    const facts = await scanRepo(root);
  
    expect(facts.frameworks).toContain('Rust/Cargo');
  });
  it('does not report a framework for an unrelated repo', async () => {
    root = await makeTempRepo();
    await writeText(root, 'README.md', '# just docs\n');

    const facts = await scanRepo(root);

    expect(facts.frameworks).not.toContain('Astro');
    expect(facts.frameworks).not.toContain('Rust/Cargo');
  });
  it('ignores files inside a Rust target/ build directory so they do not crowd out real facts', async () => {
    root = await makeTempRepo();
    await writeText(root, 'Cargo.toml', '[package]\nname = "demo"\nversion = "0.1.0"\n');
    await writeText(root, 'tests/basic.rs', '#[test]\nfn it_works() {}\n');
    for (let i = 0; i < 40; i++) {
      await writeText(root, `target/debug/deps/artifact-${i}.d`, 'noise\n');
    }

    const facts = await scanRepo(root);

    expect(facts.frameworks).toContain('Rust/Cargo');
    expect(facts.importantFolders).toContain('tests');
  });
  
});
