import type { FactsDiff, FieldDiff, RepoFacts } from './types.js';

const COMPARED_FIELDS: (keyof RepoFacts)[] = ['rootName', 'packageManagers', 'languages', 'frameworks', 'commands', 'importantFolders', 'existingAgentDocs'];

export function normalizeFacts(facts: RepoFacts): Omit<RepoFacts, 'generatedAt'> {
  const { generatedAt: _generatedAt, ...rest } = facts;
  return rest;
}

export function compareFacts(saved: RepoFacts, current: RepoFacts): FactsDiff {
  const changes: FieldDiff[] = [];
  for (const field of COMPARED_FIELDS) {
    const savedValue = saved[field];
    const currentValue = current[field];
    if (stableEqual(savedValue, currentValue)) continue;
    changes.push({
      field,
      saved: savedValue,
      current: currentValue,
      added: additions(savedValue, currentValue),
      removed: additions(currentValue, savedValue)
    });
  }
  return { fresh: changes.length === 0, changes };
}

export function formatDriftSummary(diff: FactsDiff): string {
  if (diff.fresh) return 'No AgentContextKit drift detected.';
  const lines = ['AgentContextKit drift detected:'];
  for (const change of diff.changes) {
    if (isPlainRecord(change.saved) && isPlainRecord(change.current)) {
      const keys = new Set([...Object.keys(change.saved), ...Object.keys(change.current)]);
      for (const key of Array.from(keys).sort()) {
        const before = (change.saved as Record<string, unknown>)[key];
        const after = (change.current as Record<string, unknown>)[key];
        if (JSON.stringify(before) === JSON.stringify(after)) continue;
        lines.push(`- ${change.field}.${key}:`);
        if (before !== undefined) lines.push(`  - ${String(before)}`);
        if (after !== undefined) lines.push(`  + ${String(after)}`);
      }
      continue;
    }
    lines.push(`- ${change.field}:`);
    for (const removed of change.removed) lines.push(`  - ${removed}`);
    for (const added of change.added) lines.push(`  + ${added}`);
    if (change.added.length === 0 && change.removed.length === 0) {
      lines.push(`  saved: ${JSON.stringify(change.saved)}`);
      lines.push(`  current: ${JSON.stringify(change.current)}`);
    }
  }
  return lines.join('\n');
}

function additions(before: unknown, after: unknown): string[] {
  if (Array.isArray(before) && Array.isArray(after)) {
    const old = new Set(before.map(String));
    return after.map(String).filter((value) => !old.has(value));
  }
  if (isPlainRecord(before) && isPlainRecord(after)) {
    return Object.keys(after)
      .filter((key) => !(key in before))
      .map((key) => `${key}: ${String(after[key])}`);
  }
  return stableEqual(before, after) ? [] : [String(after)];
}

function stableEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(sortDeep(a)) === JSON.stringify(sortDeep(b));
}

function sortDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortDeep);
  if (isPlainRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortDeep(child)])
    );
  }
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
