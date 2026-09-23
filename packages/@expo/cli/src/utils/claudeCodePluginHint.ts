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
    // Claude Code also sets its environment in IDE terminals where a person runs commands
    // directly, and there the raw tag would be visible. Claude Code itself runs commands with
    // piped output, so only write the hint when stderr is not a terminal.
    if (detected && agent?.id === 'claude-code' && !process.stderr.isTTY) {
      // Written to stderr, on its own line, as the hint protocol requires.
      process.stderr.write(`${CLAUDE_CODE_PLUGIN_HINT}\n`);
    }
  } catch {
    // Detection is best-effort; never let it break a command.
  }
}
