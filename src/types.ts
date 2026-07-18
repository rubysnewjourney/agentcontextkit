export type CommandName = 'test' | 'lint' | 'typecheck' | 'build';

export interface RepoFacts {
  schemaVersion: 1;
  generatedAt: string;
  rootName: string;
  packageManagers: string[];
  languages: string[];
  frameworks: string[];
  commands: Partial<Record<CommandName, string>>;
  importantFolders: string[];
  existingAgentDocs: string[];
}

export interface FieldDiff {
  field: string;
  saved: unknown;
  current: unknown;
  added: string[];
  removed: string[];
}

export interface FactsDiff {
  fresh: boolean;
  changes: FieldDiff[];
}
