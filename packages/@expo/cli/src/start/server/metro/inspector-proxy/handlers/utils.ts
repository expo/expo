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
