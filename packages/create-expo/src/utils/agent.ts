import { detectAgent } from 'agent-cli-detector';
import chalk from 'chalk';
import fs from 'fs';
import os from 'os';
import path from 'path';

const debug = require('debug')('expo:init:agent') as typeof console.log;

/** A coding agent that is running this CLI, as reported by `agent-cli-detector`. */
export type CodingAgent = {
  /** Stable identifier, for example `claude-code`, `codex`, or `cursor`. */
  id: string;
  /** Display name, for example `Claude Code`. */
  name: string;
};

export type AgentSetup = {
  /** `true` when the command installs the official Expo plugin (Expo Skills plus the Expo MCP Server), `false` when it installs Expo Skills only. */
  plugin: boolean;
  /** Command the user (or the agent) runs to set up Expo support. */
  command: string;
  /** Documentation page with the full setup for this agent. */
  learnMoreUrl: string;
};

/** Identifier of the Expo plugin in the official Claude Code plugin marketplace. */
const CLAUDE_CODE_PLUGIN = 'expo@claude-plugins-official';

/** Identifier of the Expo plugin in the OpenAI-curated Codex plugin marketplace. */
const CODEX_PLUGIN = 'expo@openai-curated';

/**
 * `agent-cli-detector` ids mapped to the names the `skills` CLI accepts for `--agent`.
 * Agents missing here get the CLI's interactive agent picker instead.
 * @see https://github.com/vercel-labs/skills#supported-agents
 */
const SKILLS_CLI_AGENT_NAMES: Record<string, string> = {
  antigravity: 'antigravity',
  cline: 'cline',
  copilot: 'github-copilot',
  cursor: 'cursor',
  devin: 'devin',
  gemini: 'gemini-cli',
  grok: 'grok',
  kilocode: 'kilo',
  kiro: 'kiro-cli',
  opencode: 'opencode',
  pi: 'pi',
  replit: 'replit',
};

/**
 * Marker that asks Claude Code to prompt the user to install the Expo plugin.
 * Claude Code strips the line from the command output before the model sees it,
 * then shows the user a one-time install prompt. Other terminals print it as-is,
 * so it should only be written when running inside Claude Code.
 * @see https://code.claude.com/docs/en/plugin-hints
 */
export const CLAUDE_CODE_PLUGIN_HINT = `<claude-code-hint v="1" type="plugin" value="${CLAUDE_CODE_PLUGIN}" />`;

/** Detect the coding agent running this CLI. Returns `null` when none is detected. */
export function detectCodingAgent(): CodingAgent | null {
  try {
    const { detected, agent } = detectAgent();
    if (!detected || agent == null) {
      return null;
    }
    return { id: agent.id, name: agent.name };
  } catch (error) {
    debug('Failed to detect coding agent: %O', error);
    return null;
  }
}

/** Resolve how to set up Expo Skills (and the Expo MCP Server, when available) for an agent. */
export function getAgentSetup(agent: CodingAgent | null): AgentSetup {
  switch (agent?.id) {
    case 'claude-code':
      return {
        plugin: true,
        command: `claude plugin install ${CLAUDE_CODE_PLUGIN}`,
        learnMoreUrl: 'https://docs.expo.dev/agents/claude/',
      };
    case 'codex':
      return {
        plugin: true,
        command: `codex plugin add ${CODEX_PLUGIN}`,
        learnMoreUrl: 'https://docs.expo.dev/agents/codex/',
      };
    default: {
      const skillsAgent = agent ? SKILLS_CLI_AGENT_NAMES[agent.id] : undefined;
      return {
        plugin: false,
        // `--skill '*'` and `-y` keep the skills CLI from prompting, so an agent can run this itself.
        command: `npx skills add expo/skills --skill '*'${skillsAgent ? ` --agent ${skillsAgent}` : ''} -y`,
        learnMoreUrl:
          agent?.id === 'cursor'
            ? 'https://docs.expo.dev/agents/cursor/'
            : 'https://docs.expo.dev/skills/',
      };
    }
  }
}

function readJsonFile(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Claude Code records installs in `plugins/installed_plugins.json` under its config directory.
 * Only a `user` scope entry applies to a new project; `project` and `local` entries belong to
 * another project path. A user-level `enabledPlugins` entry counts as well.
 */
function isClaudeCodePluginInstalled(): boolean {
  const configDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
  const installed = readJsonFile(path.join(configDir, 'plugins', 'installed_plugins.json'));
  const entries = installed?.plugins?.[CLAUDE_CODE_PLUGIN];
  if (Array.isArray(entries) && entries.some((entry) => entry?.scope === 'user')) {
    return true;
  }
  const settings = readJsonFile(path.join(configDir, 'settings.json'));
  return settings?.enabledPlugins?.[CLAUDE_CODE_PLUGIN] === true;
}

/** Codex records installed plugins as `[plugins."name@marketplace"]` tables in `config.toml`. */
function isCodexPluginInstalled(): boolean {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  try {
    const config = fs.readFileSync(path.join(codexHome, 'config.toml'), 'utf8');
    return /^\s*\[plugins\.["']expo@openai-curated["']\]/m.test(config);
  } catch {
    return false;
  }
}

/**
 * Whether the official Expo plugin is already installed for the agent.
 * Best-effort: reads the agent's own state files and never throws.
 */
export function hasExpoPlugin(agent: CodingAgent | null): boolean {
  try {
    switch (agent?.id) {
      case 'claude-code':
        return isClaudeCodePluginInstalled();
      case 'codex':
        return isCodexPluginInstalled();
      default:
        return false;
    }
  } catch (error) {
    debug('Failed to check for the Expo plugin: %O', error);
    return false;
  }
}

/**
 * Ask Claude Code to prompt the user to install the Expo plugin.
 * No-op unless this CLI runs inside Claude Code.
 */
export function emitClaudeCodePluginHint(agent: CodingAgent | null): void {
  if (agent?.id !== 'claude-code') {
    return;
  }
  // Written to stderr, on its own line, as the hint protocol requires.
  process.stderr.write(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
}

/** Print how to set up Expo Skills and the Expo MCP Server for the detected agent. */
export function logAgentSetupHint(
  agent: CodingAgent | null,
  { installed }: { installed: boolean }
): void {
  console.log();

  if (!agent) {
    console.log(
      chalk`Using an AI coding agent? Install Expo Skills and the Expo MCP Server: {underline https://docs.expo.dev/agents/}`
    );
    return;
  }

  if (installed) {
    console.log(`${agent.name} already has the Expo plugin.`);
    return;
  }

  const { plugin, command, learnMoreUrl } = getAgentSetup(agent);
  console.log(chalk.bold(`Set up ${agent.name} for Expo`));
  console.log(
    plugin
      ? 'Install the official Expo plugin to add Expo Skills and the Expo MCP Server:'
      : 'Install Expo Skills to teach it known-good Expo patterns:'
  );
  console.log(`- ${chalk.bold(command)}`);
  console.log(chalk`Learn more: {underline ${learnMoreUrl}}`);
}
