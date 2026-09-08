import { detectAgent } from 'agent-cli-detector';

/**
 * Marker that asks Claude Code to prompt the user to install the Expo plugin, which adds Expo
 * Skills and the Expo MCP Server. Claude Code strips the line from the command output before the
 * model sees it, shows a one-time install prompt, and ignores it when the plugin is already
 * installed. Other terminals would print it as-is, so it is only written inside Claude Code.
 * @see https://code.claude.com/docs/en/plugin-hints
 */
export const CLAUDE_CODE_PLUGIN_HINT =
  '<claude-code-hint v="1" type="plugin" value="expo@claude-plugins-official" />';

/** Recommend the Expo plugin to Claude Code. No-op unless Claude Code is running this command. */
export function emitClaudeCodePluginHint(): void {
  try {
    const { detected, agent } = detectAgent();
    if (detected && agent?.id === 'claude-code') {
      // Written to stderr, on its own line, as the hint protocol requires.
      process.stderr.write(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
    }
  } catch {
    // Detection is best-effort; never let it break a command.
  }
}
