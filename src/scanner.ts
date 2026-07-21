import { basename, join } from 'node:path';
import type { CommandName, RepoFacts } from './types.js';
import { listFiles, pathExists, readJsonIfExists, readTextIfExists, stableJson, topLevelDirs, uniqueSorted, writeTextEnsured } from './util.js';

const AGENT_DOCS = ['AGENTS.md', 'CLAUDE.md', '.cursor/rules/project.mdc', '.github/copilot-instructions.md'];
const IMPORTANT_DIRS = ['src', 'app', 'pages', 'api', 'tests', 'test', '__tests__', 'scripts', 'docs', 'lib', 'packages', 'components', 'server'];

type PackageJson = {
  packageManager?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export async function scanRepo(root: string = process.cwd()): Promise<RepoFacts> {
  const files = await listFiles(root);
  const packageJson = await readJsonIfExists<PackageJson>(join(root, 'package.json'));
  const pyproject = await readTextIfExists(join(root, 'pyproject.toml'));
  const requirements = await readTextIfExists(join(root, 'requirements.txt'));
  const managers = await detectPackageManagers(root, packageJson, pyproject, requirements);
  const depNames = dependencyNames(packageJson, pyproject, requirements);
  const languages = detectLanguages(files, packageJson, pyproject, requirements);
  const frameworks = detectFrameworks(files, depNames, languages);
  const commands = detectCommands(managers, packageJson, depNames, pyproject, requirements);
  const importantFolders = await detectImportantFolders(root);
  const existingAgentDocs = [];
  for (const doc of AGENT_DOCS) {
    if (await pathExists(join(root, doc))) existingAgentDocs.push(doc);
  }

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    rootName: basename(root),
    packageManagers: managers,
    languages,
    frameworks,
    commands,
    importantFolders,
    existingAgentDocs: uniqueSorted(existingAgentDocs)
  };
}

export async function writeFacts(root: string, facts: RepoFacts): Promise<void> {
  await writeTextEnsured(join(root, '.agent-context/facts.json'), stableJson(facts));
}

async function detectPackageManagers(root: string, packageJson?: PackageJson, pyproject?: string, requirements?: string): Promise<string[]> {
  const managers = new Set<string>();
  const declared = packageJson?.packageManager?.split('@')[0];
  if (declared) managers.add(declared);
  if (await pathExists(join(root, 'pnpm-lock.yaml'))) managers.add('pnpm');
  if (await pathExists(join(root, 'yarn.lock'))) managers.add('yarn');
  if (await pathExists(join(root, 'bun.lockb')) || await pathExists(join(root, 'bun.lock'))) managers.add('bun');
  if (await pathExists(join(root, 'package-lock.json'))) managers.add('npm');
  if (packageJson && managers.size === 0) managers.add('npm');
  if (await pathExists(join(root, 'uv.lock')) || /\[tool\.uv\]/.test(pyproject ?? '')) managers.add('uv');
  if (/\[tool\.poetry\]/.test(pyproject ?? '') || await pathExists(join(root, 'poetry.lock'))) managers.add('poetry');
  if (requirements !== undefined) managers.add('pip');
  return rankManagers(Array.from(managers));
}

function rankManagers(managers: string[]): string[] {
  const order = ['pnpm', 'npm', 'yarn', 'bun', 'uv', 'poetry', 'pip'];
  return managers.sort((a, b) => (order.indexOf(a) === -1 ? 99 : order.indexOf(a)) - (order.indexOf(b) === -1 ? 99 : order.indexOf(b)) || a.localeCompare(b));
}

function dependencyNames(packageJson?: PackageJson, pyproject?: string, requirements?: string): Set<string> {
  const names = new Set<string>();
  for (const bucket of [packageJson?.dependencies, packageJson?.devDependencies, packageJson?.peerDependencies]) {
    for (const name of Object.keys(bucket ?? {})) names.add(name.toLowerCase());
  }
  for (const text of [pyproject, requirements]) {
    if (!text) continue;
    for (const candidate of ['fastapi', 'django', 'pytest', 'ruff', 'mypy', 'flask']) {
      if (new RegExp(`(^|[^a-z0-9_-])${candidate}([^a-z0-9_-]|$)`, 'i').test(text)) names.add(candidate);
    }
  }
  return names;
}

function detectLanguages(files: string[], packageJson?: PackageJson, pyproject?: string, requirements?: string): string[] {
  const languages = new Set<string>();
  if (packageJson || files.some((f) => /\.[cm]?jsx?$/.test(f))) languages.add('JavaScript');
  if (files.some((f) => /\.[cm]?tsx?$/.test(f)) || dependencyNames(packageJson).has('typescript')) languages.add('TypeScript');
  if (pyproject !== undefined || requirements !== undefined || files.some((f) => f.endsWith('.py'))) languages.add('Python');
  return uniqueSorted(languages);
}

function detectFrameworks(files: string[], deps: Set<string>, languages: string[]): string[] {
  const frameworks = new Set<string>();
  if (deps.has('next') || files.some((f) => /^next\.config\.[cm]?[jt]s$/.test(f))) frameworks.add('Next.js');
  if (deps.has('react') || files.some((f) => f.endsWith('.tsx') || f.endsWith('.jsx'))) frameworks.add('React');
  if (deps.has('vite') || files.some((f) => /^vite\.config\.[cm]?[jt]s$/.test(f))) frameworks.add('Vite');
  if (deps.has('fastapi') || files.some((f) => /(^|\/)main\.py$/.test(f))) frameworks.add('FastAPI');
  if (deps.has('django') || files.some((f) => /(^|\/)manage\.py$/.test(f))) frameworks.add('Django');
  if (deps.has('astro') || files.some((f) => /^astro\.config\.[cm]?[jt]s$/.test(f))) frameworks.add('Astro');
  if (files.some((f) => /^Cargo\.toml$/.test(f))) frameworks.add('Rust/Cargo');
  if (frameworks.size === 0 && languages.length > 0) frameworks.add('generic');
  return uniqueSorted(frameworks);
}

function detectCommands(managers: string[], packageJson?: PackageJson, deps?: Set<string>, pyproject?: string, requirements?: string): Partial<Record<CommandName, string>> {
  const commands: Partial<Record<CommandName, string>> = {};
  const scripts = packageJson?.scripts ?? {};
  const nodeRunner = pickNodeRunner(managers);
  for (const key of ['test', 'lint', 'typecheck', 'build'] as CommandName[]) {
    if (scripts[key]) commands[key] = nodeRunner === 'npm' ? `npm run ${key}` : `${nodeRunner} ${key}`;
  }
  if (commands.test === 'npm run test') commands.test = 'npm test';

  const pythonRunner = pickPythonRunner(managers);
  const pythonText = `${pyproject ?? ''}\n${requirements ?? ''}`;
  if (!commands.test && (deps?.has('pytest') || /\[tool\.pytest/.test(pythonText))) commands.test = `${pythonRunner}pytest`;
  if (!commands.lint && deps?.has('ruff')) commands.lint = `${pythonRunner}ruff check .`;
  if (!commands.typecheck && deps?.has('mypy')) commands.typecheck = `${pythonRunner}mypy .`;
  return commands;
}

function pickNodeRunner(managers: string[]): string {
  return managers.find((m) => ['pnpm', 'npm', 'yarn', 'bun'].includes(m)) ?? 'npm';
}

function pickPythonRunner(managers: string[]): string {
  if (managers.includes('uv')) return 'uv run ';
  if (managers.includes('poetry')) return 'poetry run ';
  return '';
}

async function detectImportantFolders(root: string): Promise<string[]> {
  const dirs = await topLevelDirs(root);
  const found = dirs.filter((dir) => IMPORTANT_DIRS.includes(dir) || dir.startsWith('packages'));
  return uniqueSorted(found);
}
