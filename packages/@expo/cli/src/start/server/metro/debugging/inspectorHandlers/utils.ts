import type WS from 'ws';

import { DebuggerResponse, DeviceResponse } from './types';

/**
 * Helper function to respond to a message from the debugger or device.
 * The return value is used to stop the message propagation, "canceling" further handling.
 *
 * @example ```
 *  return respond<DeviceResponse<CDP>>(socket, { id: message.id, result: {} });
 * ```
 */
export function respond<T = DeviceResponse | DebuggerResponse>(socket: WS, message: T) {
  socket.send(JSON.stringify(message));
  return true;
}

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
