import { afterEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { cleanup, makeTempRepo, writeText } from './helpers.js';

let root: string | undefined;
afterEach(async () => {
  if (root) await cleanup(root);
  root = undefined;
});

function runCli(args: string[], cwd: string) {
  const repoRoot = process.cwd();
  return spawnSync(process.execPath, [join(repoRoot, 'node_modules/tsx/dist/cli.mjs'), join(repoRoot, 'src/cli.ts'), ...args], {
    cwd,
    encoding: 'utf8'
  });
}

describe('CLI', () => {
  it('scan, write, check, and diff work end-to-end', async () => {
    root = await makeTempRepo();
    await writeText(root, 'package.json', JSON.stringify({ scripts: { test: 'vitest run' }, dependencies: { react: '^19.0.0' } }, null, 2));
    await writeText(root, 'src/index.ts', 'export {};\n');

    const scan = runCli(['scan'], root);
    expect(scan.status).toBe(0);
    expect(scan.stdout).toContain('Wrote .agent-context/facts.json');

    const write = runCli(['write'], root);
    expect(write.status).toBe(0);
    expect(write.stdout).toContain('Wrote agent context files');

    const checkFresh = runCli(['check'], root);
    expect(checkFresh.status).toBe(0);
    expect(checkFresh.stdout).toContain('AgentContextKit facts are fresh');

    await writeText(root, 'package.json', JSON.stringify({ scripts: { test: 'vitest run', build: 'vite build' }, dependencies: { react: '^19.0.0' }, devDependencies: { vite: '^6.0.0' } }, null, 2));
    const diff = runCli(['diff'], root);
    expect(diff.status).toBe(1);
    expect(diff.stdout).toContain('commands.build');

    const staleCheck = runCli(['check'], root);
    expect(staleCheck.status).toBe(1);
    expect(staleCheck.stdout).toContain('AgentContextKit facts are stale');

    const saved = await readFile(join(root, '.agent-context/facts.json'), 'utf8');
    expect(saved).toContain('packageManagers');
  });
});
