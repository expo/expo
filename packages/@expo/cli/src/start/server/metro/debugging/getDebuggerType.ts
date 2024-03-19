/** Known compatible debuggers that require specific workarounds */
export type DebuggerType = 'chrome' | 'vscode' | 'unknown';

// Patterns to test against user agents
const CHROME_USER_AGENT = /chrome/i;
const VSCODE_USER_AGENT = /vscode/i;

/**
 * Determine the debugger type based on the known user agent.
 */
export function getDebuggerType(userAgent?: string | null): DebuggerType {
  if (userAgent && CHROME_USER_AGENT.test(userAgent)) return 'chrome';
  if (userAgent && VSCODE_USER_AGENT.test(userAgent)) return 'vscode';
  return 'unknown';
}
