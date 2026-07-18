import { afterEach, describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cleanup, makeTempRepo, writeText } from './helpers.js';
import { scanRepo } from '../src/scanner.js';
import { writeContextFiles } from '../src/writer.js';

let root: string | undefined;
afterEach(async () => {
  if (root) await cleanup(root);
  root = undefined;
});

describe('writeContextFiles', () => {
  it('generates all agent context files and preserves user content outside markers', async () => {
    root = await makeTempRepo();
    await writeText(root, 'package.json', JSON.stringify({ scripts: { test: 'node --test' } }, null, 2));
    await writeText(root, 'src/index.js', 'console.log("hi");\n');
    await writeText(root, 'AGENTS.md', '# Human notes\n\nDo not remove me.\n');

    const facts = await scanRepo(root);
    await writeContextFiles(root, facts);

    const agents = await readFile(join(root, 'AGENTS.md'), 'utf8');
    const claude = await readFile(join(root, 'CLAUDE.md'), 'utf8');
    const cursor = await readFile(join(root, '.cursor/rules/project.mdc'), 'utf8');
    const copilot = await readFile(join(root, '.github/copilot-instructions.md'), 'utf8');
    const repoMap = await readFile(join(root, '.agent-context/repo-map.md'), 'utf8');

    expect(agents).toContain('Do not remove me.');
    expect(agents).toContain('<!-- repobrief:start -->');
    expect(agents).toContain('npm test');
    expect(claude).toContain('RepoBrief Context');
    expect(cursor).toContain('alwaysApply: true');
    expect(copilot).toContain('Use the commands below');
    expect(repoMap).toContain('## Important folders');
  });

  it('replaces only the managed marker block on repeat writes', async () => {
    root = await makeTempRepo();
    await writeText(root, 'package.json', JSON.stringify({ scripts: { test: 'node --test' } }, null, 2));
    await writeText(root, 'AGENTS.md', 'Top\n<!-- repobrief:start -->\nstale\n<!-- repobrief:end -->\nBottom\n');

    await writeContextFiles(root, await scanRepo(root));
    const agents = await readFile(join(root, 'AGENTS.md'), 'utf8');

    expect(agents).toMatch(/^Top/);
    expect(agents).toContain('Bottom');
    expect(agents).not.toContain('stale');
    expect((agents.match(/repobrief:start/g) ?? []).length).toBe(1);
  });
});
