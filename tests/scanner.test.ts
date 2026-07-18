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
});
