import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

describe('npm package metadata', () => {
  it('publishes as ackit while exposing the ackit CLI binary', async () => {
    const repoRoot = process.cwd();
    const packageJson = JSON.parse(await readFile(join(repoRoot, 'package.json'), 'utf8')) as { name: string; bin: Record<string, string> };
    const packageLock = JSON.parse(await readFile(join(repoRoot, 'package-lock.json'), 'utf8')) as { name: string; packages: Record<string, { name?: string; bin?: Record<string, string> }> };

    expect(packageJson.name).toBe('ackit');
    expect(packageJson.bin).toEqual({ ackit: 'dist/cli.js' });
    expect(packageLock.name).toBe('ackit');
    expect(packageLock.packages[''].name).toBe('ackit');
    expect(packageLock.packages[''].bin).toEqual({ ackit: 'dist/cli.js' });
  });
});
