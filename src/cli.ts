#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { scanRepo, writeFacts } from './scanner.js';
import { writeContextFiles } from './writer.js';
import { compareFacts, formatDriftSummary } from './diff.js';
import type { RepoFacts } from './types.js';

interface ParsedArgs {
  command: string;
  root: string;
  help: boolean;
}

async function main(argv: string[] = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    return 0;
  }

  try {
    switch (args.command) {
      case 'scan': {
        const facts = await scanRepo(args.root);
        await writeFacts(args.root, facts);
        console.log(`Wrote .agent-context/facts.json for ${facts.rootName}`);
        return 0;
      }
      case 'write': {
        const facts = await scanRepo(args.root);
        const files = await writeContextFiles(args.root, facts);
        console.log(`Wrote agent context files:\n${files.map((file) => `- ${file}`).join('\n')}`);
        return 0;
      }
      case 'check': {
        const saved = await readSavedFacts(args.root);
        const current = await scanRepo(args.root);
        const diff = compareFacts(saved, current);
        if (diff.fresh) {
          console.log('AgentContextKit facts are fresh.');
          return 0;
        }
        console.log(`AgentContextKit facts are stale. Run \`ackit write\` to refresh.\n\n${formatDriftSummary(diff)}`);
        return 1;
      }
      case 'diff': {
        const saved = await readSavedFacts(args.root);
        const current = await scanRepo(args.root);
        const diff = compareFacts(saved, current);
        console.log(formatDriftSummary(diff));
        return diff.fresh ? 0 : 1;
      }
      default:
        console.error(`Unknown command: ${args.command}`);
        printHelp();
        return 2;
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  let command = '';
  let root = process.cwd();
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--root') {
      const value = argv[index + 1];
      if (!value) throw new Error('--root requires a path');
      root = resolve(value);
      index += 1;
    } else if (!command) {
      command = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return { command, root, help };
}

async function readSavedFacts(root: string): Promise<RepoFacts> {
  const path = join(root, '.agent-context/facts.json');
  try {
    return JSON.parse(await readFile(path, 'utf8')) as RepoFacts;
  } catch (error) {
    throw new Error(`No saved facts found at ${path}. Run \`ackit scan\` or \`ackit write\` first.`);
  }
}

function printHelp(): void {
  console.log(`AgentContextKit\n\nOne command to keep AI coding agents aligned with your repo.\n\nUsage:\n  ackit scan [--root <path>]\n  ackit write [--root <path>]\n  ackit check [--root <path>]\n  ackit diff [--root <path>]\n`);
}

main().then((code) => {
  process.exitCode = code;
});

export { main, parseArgs };
