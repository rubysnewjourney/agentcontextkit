import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readTextIfExists(path: string): Promise<string | undefined> {
  if (!(await pathExists(path))) return undefined;
  return readFile(path, 'utf8');
}

export async function readJsonIfExists<T>(path: string): Promise<T | undefined> {
  const text = await readTextIfExists(path);
  if (!text) return undefined;
  return JSON.parse(text) as T;
}

export async function writeTextEnsured(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export function sortObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) as T;
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(sortDeep(value), null, 2)}\n`;
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortDeep(child)])
    );
  }
  return value;
}

export async function listFiles(root: string, options: { maxFiles?: number } = {}): Promise<string[]> {
  const maxFiles = options.maxFiles ?? 5000;
  const ignored = new Set(['.git', 'node_modules', 'dist', 'build', '.next', 'coverage', '.venv', 'venv', '__pycache__', '.pytest_cache', '.mypy_cache', 'target']);
  const result: string[] = [];
  async function walk(dir: string): Promise<void> {
    if (result.length >= maxFiles) return;
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (result.length >= maxFiles) break;
      if (ignored.has(entry.name)) continue;
      const full = join(dir, entry.name);
      const rel = relative(root, full).split('\\').join('/');
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        result.push(rel);
      }
    }
  }
  await walk(root);
  return result.sort((a, b) => a.localeCompare(b));
}

export async function topLevelDirs(root: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const ignored = new Set(['.git', 'node_modules', 'dist', 'build', 'coverage']);
  const dirs: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || ignored.has(entry.name)) continue;
    try {
      if ((await stat(join(root, entry.name))).isDirectory()) dirs.push(entry.name);
    } catch {
      // ignore races
    }
  }
  return dirs.sort((a, b) => a.localeCompare(b));
}
