import { detectAgent } from 'agent-cli-detector';
import chalk from 'chalk';

const debug = require('debug')('expo:init:agent') as typeof console.log;

/** A coding agent that is running this CLI, as reported by `agent-cli-detector`. */
export type CodingAgent = {
  /** Stable identifier, for example `claude-code`, `codex`, or `cursor`. */
  id: string;
  /** Display name, for example `Claude Code`. */
  name: string;
};

export type AgentSetupInstructions = {
  /** Sentence that introduces the command, without a trailing colon. */
  description: string;
  /** Command the user (or the agent) runs to set up Expo support. */
  command: string;
  /** Documentation page with the full setup for this agent. */
  learnMoreUrl: string;
};

/** Identifier of the Expo plugin in the official Claude Code plugin marketplace. */
const CLAUDE_CODE_PLUGIN = 'expo@claude-plugins-official';

/** Identifier of the Expo plugin in the OpenAI-curated Codex plugin marketplace. */
const CODEX_PLUGIN = 'expo@openai-curated';

/** The `skills` CLI command that installs Expo Skills for agents without an official plugin. */
const SKILLS_CLI_COMMAND = 'npx skills add expo/skills';

const PLUGIN_DESCRIPTION =
  'Install the official Expo plugin to add Expo Skills and the Expo MCP Server';
const SKILLS_DESCRIPTION = 'Install Expo Skills to teach it known-good Expo patterns';

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
export function getAgentSetupInstructions(agent: CodingAgent | null): AgentSetupInstructions {
  switch (agent?.id) {
    case 'claude-code':
      return {
        description: PLUGIN_DESCRIPTION,
        command: `claude plugin install ${CLAUDE_CODE_PLUGIN}`,
        learnMoreUrl: 'https://docs.expo.dev/agents/claude/',
      };
    case 'codex':
      return {
        description: PLUGIN_DESCRIPTION,
        command: `codex plugin add ${CODEX_PLUGIN}`,
        learnMoreUrl: 'https://docs.expo.dev/agents/codex/',
      };
    case 'cursor':
      return {
        description: SKILLS_DESCRIPTION,
        command: SKILLS_CLI_COMMAND,
        learnMoreUrl: 'https://docs.expo.dev/agents/cursor/',
      };
    default:
      return {
        description: SKILLS_DESCRIPTION,
        command: SKILLS_CLI_COMMAND,
        learnMoreUrl: 'https://docs.expo.dev/skills/',
      };
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
export function logAgentSetupHint(agent: CodingAgent | null): void {
  console.log();

  if (!agent) {
    console.log(
      chalk`Using an AI coding agent? Install Expo Skills and the Expo MCP Server: {underline https://docs.expo.dev/agents/}`
    );
    return;
  }

  const { description, command, learnMoreUrl } = getAgentSetupInstructions(agent);
  console.log(chalk.bold(`Set up ${agent.name} for Expo`));
  console.log(`${description}:`);
  console.log(`- ${chalk.bold(command)}`);
  console.log(chalk`Learn more: {underline ${learnMoreUrl}}`);
}
