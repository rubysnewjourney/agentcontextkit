import { describe, expect, it } from 'vitest';
import { compareFacts, formatDriftSummary } from '../src/diff.js';
import type { RepoFacts } from '../src/types.js';

const base: RepoFacts = {
  schemaVersion: 1,
  generatedAt: 'ignored',
  rootName: 'demo',
  packageManagers: ['npm'],
  languages: ['JavaScript'],
  frameworks: ['generic'],
  commands: { test: 'npm test' },
  importantFolders: ['src'],
  existingAgentDocs: []
};

describe('compareFacts', () => {
  it('ignores generatedAt and reports concise field-level differences', () => {
    const current: RepoFacts = {
      ...base,
      generatedAt: 'newer',
      languages: ['JavaScript', 'TypeScript'],
      commands: { test: 'npm test', build: 'npm run build' }
    };

    const diff = compareFacts(base, current);
    const summary = formatDriftSummary(diff);

    expect(diff.fresh).toBe(false);
    expect(summary).toContain('languages');
    expect(summary).toContain('+ TypeScript');
    expect(summary).toContain('commands.build');
    expect(summary).toContain('+ npm run build');
  });

  it('marks facts fresh when only generatedAt differs', () => {
    expect(compareFacts(base, { ...base, generatedAt: 'newer' }).fresh).toBe(true);
  });

  it('treats object key order differences as fresh', () => {
    const saved: RepoFacts = {
      ...base,
      commands: { build: 'npm run build', test: 'npm test' }
    };
    const current: RepoFacts = {
      ...base,
      commands: { test: 'npm test', build: 'npm run build' }
    };

    expect(compareFacts(saved, current).fresh).toBe(true);
  });
});
