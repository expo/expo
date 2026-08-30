import fs from 'fs';
import os from 'os';
import path from 'path';

import * as Log from '../log';
import { directoryExistsAsync } from '../utils/dir';
import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { CommandError } from '../utils/errors';
import { type SkillsAgent } from './types';

interface AgentDefinition extends SkillsAgent {
  /** Directories inside the project that indicate the agent is used here. */
  projectMarkers: string[];
  /** Directories inside the user home directory that indicate the agent is installed. */
  homeMarkers: string[];
}

// The skill directory conventions follow https://github.com/vercel-labs/skills
// and https://github.com/antfu/skills-npm, so skills stay shared between tools.
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

/** All agents that `npx @expo/agent-cli skills` can link skills for. */
export function getAllAgents(): SkillsAgent[] {
  return AGENTS.map(toPublicAgent);
}

/** Per-machine cache in `.expo` remembering which agents were selected. */
function getAgentsCachePath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', 'agent-skill-links.json');
}

/** Agents with a marker directory in the project or in the user home directory. */
export async function detectInstalledAgentsAsync(projectRoot: string): Promise<SkillsAgent[]> {
  const homeDir = os.homedir();
  const detected = await Promise.all(
    AGENTS.map(async (agent) => {
      const markers = [
        ...agent.projectMarkers.map((marker) => path.join(projectRoot, marker)),
        ...agent.homeMarkers.map((marker) => path.join(homeDir, marker)),
      ];
      const results = await Promise.all(markers.map((marker) => directoryExistsAsync(marker)));
      return results.some(Boolean) ? toPublicAgent(agent) : null;
    })
  );
  return detected.filter((agent): agent is SkillsAgent => agent != null);
}

/** Agent ids selected in a previous run, from the `.expo/agent-skill-links.json` cache, or `null` when unset. */
export async function getPersistedAgentIdsAsync(projectRoot: string): Promise<string[] | null> {
  let ids: unknown;
  try {
    const contents = await fs.promises.readFile(getAgentsCachePath(projectRoot), 'utf8');
    ids = JSON.parse(contents).agents;
  } catch {
    return null;
  }
  if (!Array.isArray(ids)) {
    return null;
  }

  const knownIds = ids.filter((id): id is string => typeof id === 'string' && !!findAgent(id));
  const unknownIds = ids.filter((id) => !knownIds.includes(id as string));
  if (unknownIds.length) {
    Log.warn(
      `Ignoring unknown agents in the .expo/agent-skill-links.json cache: ${unknownIds.join(', ')}. Valid agents: ${getAgentIds().join(', ')}.`
    );
  }

  return knownIds;
}

/** Where a resolved agent selection came from. `flags` becomes the new cache. */
export type AgentSelectionSource = 'flags' | 'cache' | 'detected';

/**
 * Resolve which agents to link skills for, in order: `--agent` flags, the cached selection in
 * `.expo/agent-skill-links.json`, then marker detection.
 *
 * @ref llp/0008-guardrails.rfc.md §Consent is a re-run, never a prompt
 * A terminal used to get a checklist of agents here, with the detected ones ticked. It is gone: a
 * question this CLI cannot ask is a question it must not have, and the answer it was collecting is
 * the one the non-interactive path had already been giving for free. The same project now answers
 * the same way whoever runs it, and `--agent` is how a caller overrides the detection — once, into
 * the cache that the next run reads.
 */
export async function resolveAgentsAsync(
  projectRoot: string,
  options: { agents?: string[] }
): Promise<{ agents: SkillsAgent[]; source: AgentSelectionSource }> {
  if (options.agents?.length) {
    return { agents: options.agents.map(assertAgent), source: 'flags' };
  }

  const persistedIds = await getPersistedAgentIdsAsync(projectRoot);
  if (persistedIds?.length) {
    return { agents: persistedIds.map(assertAgent), source: 'cache' };
  }

  const detected = await detectInstalledAgentsAsync(projectRoot);
  if (!detected.length) {
    throw new CommandError(
      'BAD_ARGS',
      `No coding agent was found in this project, so there is nowhere to link the skills to. Pass the agents to link skills for, e.g. --agent claude-code, which is saved for the runs after it. Valid agents: ${getAgentIds().join(', ')}.`
    );
  }

  return { agents: detected, source: 'detected' };
}

/** Store the selected agent ids in the `.expo/agent-skill-links.json` cache. */
export async function persistAgentSelectionAsync(
  projectRoot: string,
  agents: SkillsAgent[]
): Promise<void> {
  const ids = [...new Set(agents.map((agent) => agent.id))].sort();
  ensureDotExpoProjectDirectoryInitialized(projectRoot);

  const cachePath = getAgentsCachePath(projectRoot);
  let existing = {};
  try {
    existing = JSON.parse(await fs.promises.readFile(cachePath, 'utf8'));
  } catch {}
  await fs.promises.writeFile(cachePath, JSON.stringify({ ...existing, agents: ids }, null, 2));
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
