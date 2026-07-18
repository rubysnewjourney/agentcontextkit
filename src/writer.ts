import { join } from 'node:path';
import type { RepoFacts } from './types.js';
import { readTextIfExists, uniqueSorted, writeTextEnsured } from './util.js';
import { renderAgents, renderClaude, renderCopilot, renderCursor, renderRepoMap, withManagedBlock } from './renderer.js';
import { writeFacts } from './scanner.js';

export async function writeContextFiles(root: string, facts: RepoFacts): Promise<string[]> {
  const targets = [
    { path: 'AGENTS.md', render: renderAgents, managed: true },
    { path: 'CLAUDE.md', render: renderClaude, managed: true },
    { path: '.cursor/rules/project.mdc', render: renderCursor, managed: true },
    { path: '.github/copilot-instructions.md', render: renderCopilot, managed: true },
    { path: '.agent-context/repo-map.md', render: renderRepoMap, managed: false }
  ];
  const written: string[] = [];
  for (const target of targets) {
    const fullPath = join(root, target.path);
    const rendered = target.render(facts);
    const existing = await readTextIfExists(fullPath);
    const content = target.managed ? withManagedBlock(existing, rendered) : rendered;
    await writeTextEnsured(fullPath, content);
    written.push(target.path);
  }
  const factsForSave: RepoFacts = {
    ...facts,
    existingAgentDocs: uniqueSorted([...facts.existingAgentDocs, ...targets.filter((target) => target.managed).map((target) => target.path)])
  };
  await writeFacts(root, factsForSave);
  written.push('.agent-context/facts.json');
  return written;
}
