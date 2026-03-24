import fs from 'fs';
import path from 'path';
import prompts from 'prompts';

import { Log } from './log';
import { PackageManagerName } from './resolvePackageManager';
import { env } from './utils/env';
import { withSectionLog } from './utils/log';

const debug = require('debug')('expo:init:agents') as typeof console.log;

/** Shared file read by all AI coding tools (Claude Code, Cursor, Windsurf, Copilot, Codex, etc.) */
const SHARED_AGENT_FILE = 'AGENTS.md';

export const AGENTS = [
  { id: 'claude', name: 'Claude Code', paths: ['CLAUDE.md', '.claude'] },
  { id: 'cursor', name: 'Cursor', paths: ['.cursor'] },
  { id: 'windsurf', name: 'Windsurf', paths: ['.windsurf'] },
  { id: 'copilot', name: 'GitHub Copilot', paths: ['.github/copilot-instructions.md'] },
  { id: 'other', name: 'Other (installs AGENTS.md)', paths: [] },
] as const;

export type AgentId = (typeof AGENTS)[number]['id'];

export type AgentContext = {
  packageManager: PackageManagerName;
};

function getRunCommand(packageManager: PackageManagerName): string {
  switch (packageManager) {
    case 'yarn':
      return 'yarn';
    case 'npm':
      return 'npm run';
    case 'pnpm':
      return 'pnpm';
    case 'bun':
      return 'bun run';
  }
}

async function readProjectInfo(projectRoot: string): Promise<{ name: string; sdkVersion: string }> {
  try {
    const pkgJson = JSON.parse(
      await fs.promises.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
    );
    const name = pkgJson.name || path.basename(projectRoot);
    const expoVersion = pkgJson.dependencies?.expo || '';
    // Extract major version: "~55.0.0" → "55", "^55.1.2" → "55"
    const sdkVersion = expoVersion.replace(/^[~^]/, '').split('.')[0] || 'latest';
    return { name, sdkVersion };
  } catch {
    return { name: path.basename(projectRoot), sdkVersion: 'latest' };
  }
}

function replacePlaceholders(content: string, vars: Record<string, string>): string {
  return content.replace(/\{\{(\w+)\}\}/g, (match, key) => vars[key] ?? match);
}

const TEXT_EXTENSIONS = new Set(['.md', '.mdc', '.txt', '.json']);

async function replaceInFile(filePath: string, vars: Record<string, string>) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const replaced = replacePlaceholders(content, vars);
    if (replaced !== content) {
      await fs.promises.writeFile(filePath, replaced, 'utf-8');
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      debug(`Error processing %s: %O`, filePath, error);
    }
  }
}

async function replaceInDirectory(dirPath: string, vars: Record<string, string>) {
  let entries;
  try {
    entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      debug(`Error reading directory %s: %O`, dirPath, error);
    }
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await replaceInDirectory(fullPath, vars);
    } else if (entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name))) {
      await replaceInFile(fullPath, vars);
    }
  }
}

async function replaceInAgentFiles(projectRoot: string, vars: Record<string, string>) {
  await replaceInFile(path.join(projectRoot, SHARED_AGENT_FILE), vars);

  for (const agent of AGENTS) {
    for (const p of agent.paths) {
      const fullPath = path.join(projectRoot, p);
      if (path.extname(fullPath)) {
        await replaceInFile(fullPath, vars);
      } else {
        await replaceInDirectory(fullPath, vars);
      }
    }
  }
}

async function removeFileOrDirectory(fullPath: string) {
  try {
    await fs.promises.rm(fullPath, { recursive: true, force: true });
  } catch (error: any) {
    debug(`Error removing %s: %O`, fullPath, error);
  }
}

export async function setupAgentsAsync(
  projectRoot: string,
  options: { agents?: string | true; yes?: boolean },
  context: AgentContext
): Promise<void> {
  const selected = await resolveAgents(options.agents, options.yes);

  await withSectionLog(
    async () => {
      const unselected = AGENTS.filter((a) => !selected.includes(a.id));
      for (const agent of unselected) {
        for (const p of agent.paths) {
          await removeFileOrDirectory(path.join(projectRoot, p));
        }
      }

      if (selected.length === 0) {
        await removeFileOrDirectory(path.join(projectRoot, SHARED_AGENT_FILE));
      }

      if (selected.length > 0) {
        const { name, sdkVersion } = await readProjectInfo(projectRoot);
        const vars: Record<string, string> = {
          packageManager: context.packageManager,
          packageRunCommand: getRunCommand(context.packageManager),
          projectName: name,
          sdkVersion,
        };
        await replaceInAgentFiles(projectRoot, vars);

        const names = selected.map((id) => AGENTS.find((a) => a.id === id)!.name).join(', ');
        Log.log(`  Configured: ${names}`);
      }
    },
    {
      pending: 'Configuring AI coding agents.',
      success: 'Configured AI coding agents.',
      error: (error) => `Error configuring AI coding agents: ${error.message}`,
    }
  );
}

export async function resolveAgents(
  agentsArg: string | true | undefined,
  yes?: boolean
): Promise<AgentId[]> {
  // --agents claude,cursor (explicit list)
  if (typeof agentsArg === 'string') {
    return parseAgentIds(agentsArg);
  }

  // --yes with no --agents → skip (remove all)
  if (yes) {
    return [];
  }

  // Non-interactive → skip
  if (env.CI) {
    return [];
  }

  // Interactive mode → prompt
  return await promptAgentsAsync();
}

function parseAgentIds(input: string): AgentId[] {
  const validIds = AGENTS.map((a) => a.id);
  const ids = input.split(',').map((s) => s.trim().toLowerCase());
  const invalid = ids.filter((id) => !validIds.includes(id as AgentId));
  if (invalid.length > 0) {
    Log.log(
      `Warning: Unknown agent(s): ${invalid.join(', ')}. Valid options: ${validIds.join(', ')}`
    );
  }
  return ids.filter((id) => validIds.includes(id as AgentId)) as AgentId[];
}

export async function promptAgentsAsync(): Promise<AgentId[]> {
  const { answer } = await prompts({
    type: 'multiselect',
    name: 'answer',
    message: 'Which AI coding agents do you use?',
    choices: AGENTS.map((agent) => ({
      title: agent.name,
      value: agent.id,
    })),
    hint: 'Space to toggle, Enter to confirm, Esc to skip',
    instructions: false,
  });

  // User pressed Escape or Ctrl+C
  if (answer === undefined) {
    return [];
  }

  return answer;
}
