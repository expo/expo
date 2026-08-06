import JsonFile, { type JSONObject } from '@expo/json-file';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as Log from '../log';
import { CommandError } from '../utils/errors';
import { isInteractive } from '../utils/interactive';
import { promptAsync } from '../utils/prompts';
import { type SkillsAgent } from './types';

interface AgentDefinition extends SkillsAgent {
  /** Directories inside the project that indicate the agent is used here. */
  projectMarkers: string[];
  /** Directories inside the user home directory that indicate the agent is installed. */
  homeMarkers: string[];
}

const AGENTS: AgentDefinition[] = [
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    projectMarkers: ['.claude'],
    homeMarkers: ['.claude'],
  },
  {
    id: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.agents/skills',
    projectMarkers: ['.cursor'],
    homeMarkers: ['.cursor'],
  },
  {
    id: 'codex',
    displayName: 'Codex',
    skillsDir: '.agents/skills',
    projectMarkers: ['.codex'],
    homeMarkers: ['.codex'],
  },
  {
    id: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.agents/skills',
    projectMarkers: ['.opencode'],
    homeMarkers: ['.config/opencode'],
  },
  {
    id: 'windsurf',
    displayName: 'Windsurf',
    skillsDir: '.agents/skills',
    projectMarkers: ['.windsurf'],
    homeMarkers: ['.codeium'],
  },
  {
    id: 'gemini-cli',
    displayName: 'Gemini CLI',
    skillsDir: '.agents/skills',
    projectMarkers: ['.gemini'],
    homeMarkers: ['.gemini'],
  },
];

/** All agents that `npx expo skills` can link skills for. */
export function getAllAgents(): SkillsAgent[] {
  return AGENTS.map(toPublicAgent);
}

/** Agents with a marker directory in the project or in the user home directory. */
export function detectInstalledAgents(projectRoot: string): SkillsAgent[] {
  const homeDir = os.homedir();
  return AGENTS.filter(
    (agent) =>
      agent.projectMarkers.some((marker) => directoryExists(path.join(projectRoot, marker))) ||
      agent.homeMarkers.some((marker) => directoryExists(path.join(homeDir, marker)))
  ).map(toPublicAgent);
}

/** Agent ids from the `expo.skills.agents` field in package.json, or `null` when unset. */
export function getPersistedAgentIds(projectRoot: string): string[] | null {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    return null;
  }

  const packageJson = JsonFile.read(packageJsonPath, { json5: false });
  const ids = getSkillsConfig(packageJson)?.agents;
  if (!Array.isArray(ids)) {
    return null;
  }

  const knownIds = ids.filter((id): id is string => typeof id === 'string' && !!findAgent(id));
  const unknownIds = ids.filter((id) => !knownIds.includes(id as string));
  if (unknownIds.length) {
    Log.warn(
      `Ignoring unknown agents in the package.json "expo.skills.agents" field: ${unknownIds.join(', ')}. Valid agents: ${getAgentIds().join(', ')}.`
    );
  }

  return knownIds;
}

/**
 * Resolve which agents to link skills for, in order: `--agent` flags, the persisted
 * `expo.skills.agents` field, an interactive prompt, then marker detection.
 */
export async function resolveAgentsAsync(
  projectRoot: string,
  options: { agents?: string[] }
): Promise<{ agents: SkillsAgent[]; fromPrompt: boolean }> {
  if (options.agents?.length) {
    return { agents: options.agents.map(assertAgent), fromPrompt: false };
  }

  const persistedIds = getPersistedAgentIds(projectRoot);
  if (persistedIds?.length) {
    return { agents: persistedIds.map(assertAgent), fromPrompt: false };
  }

  const detected = detectInstalledAgents(projectRoot);

  if (isInteractive()) {
    const agents = await promptAgentsAsync(detected);
    if (!agents.length) {
      throw new CommandError(
        'BAD_ARGS',
        `No agent was selected, so there is nowhere to link the skills to. Run the command again and select at least one agent with the space bar, or pass them directly, e.g. --agent claude-code. Valid agents: ${getAgentIds().join(', ')}.`
      );
    }
    return { agents, fromPrompt: true };
  }

  if (!detected.length) {
    throw new CommandError(
      'BAD_ARGS',
      `No coding agent was found in this project and the terminal is non-interactive, so the agents cannot be selected. Pass the agents to link skills for, e.g. --agent claude-code, or add them to the package.json "expo.skills.agents" field. Valid agents: ${getAgentIds().join(', ')}.`
    );
  }

  return { agents: detected, fromPrompt: false };
}

/** Store the selected agent ids in the `expo.skills.agents` field in package.json. */
export async function persistAgentSelectionAsync(
  projectRoot: string,
  agents: SkillsAgent[]
): Promise<void> {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = await JsonFile.readAsync(packageJsonPath, { json5: false });
  const expoConfig = getObject(packageJson.expo) ?? {};
  const skillsConfig = getSkillsConfig(packageJson) ?? {};
  const ids = [...new Set(agents.map((agent) => agent.id))].sort();

  await JsonFile.setAsync(
    packageJsonPath,
    'expo',
    { ...expoConfig, skills: { ...skillsConfig, agents: ids } },
    { json5: false }
  );
}

async function promptAgentsAsync(detected: SkillsAgent[]): Promise<SkillsAgent[]> {
  const detectedIds = new Set(detected.map((agent) => agent.id));
  const { agents } = await promptAsync({
    type: 'multiselect',
    name: 'agents',
    message: 'Which coding agents should have access to the skills?',
    hint: '- Space to select. Return to submit',
    instructions: '',
    limit: AGENTS.length,
    choices: AGENTS.map((agent) => ({
      title: agent.displayName,
      value: agent.id,
      selected: detectedIds.has(agent.id),
    })),
  });

  return (agents ?? []).map(assertAgent);
}

function assertAgent(id: string): SkillsAgent {
  const agent = findAgent(id);
  if (!agent) {
    throw new CommandError(
      'BAD_ARGS',
      `Unknown agent: ${id}. Valid agents: ${getAgentIds().join(', ')}.`
    );
  }
  return toPublicAgent(agent);
}

function findAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find((agent) => agent.id === id);
}

function getAgentIds(): string[] {
  return AGENTS.map((agent) => agent.id);
}

function toPublicAgent({ id, displayName, skillsDir }: AgentDefinition): SkillsAgent {
  return { id, displayName, skillsDir };
}

function getSkillsConfig(packageJson: JSONObject): JSONObject | null {
  const expoConfig = getObject(packageJson.expo);
  return expoConfig ? getObject(expoConfig.skills) : null;
}

function getObject(value: unknown): JSONObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JSONObject)
    : null;
}

function directoryExists(directory: string): boolean {
  return !!fs.statSync(directory, { throwIfNoEntry: false })?.isDirectory();
}
