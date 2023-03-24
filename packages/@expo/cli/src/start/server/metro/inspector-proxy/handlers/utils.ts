import type WS from 'ws';

import {
  CdpMessage,
  DebuggerRequest,
  DebuggerResponse,
  DeviceRequest,
  DeviceResponse,
} from './types';

/**
 * Respond to CDP requests from either the device or debugger.
 * This produces the following message structures, based on the request type:
 * - DebuggerRequest<T>: { id: number, result: <response> }
 * - DebuggerRequest<T>: { id: number, error: { message: <response.error> } }
 * - DeviceRequest<T>: { result: <response> }
 * - DeviceRequest<T>: { error: { message: <response.error> } }
 */
export function respond<T extends CdpMessage>(
  socket: WS,
  request: DebuggerRequest<T> | DeviceRequest<T>,
  response: DebuggerResponse<T>['result'] | DeviceResponse<T>['result'] | { error: string }
) {
  const message: any = {};

  if ('id' in request) {
    message.id = request.id;
  }

  if ('error' in response) {
    message.error = { message: response.error };
  } else {
    message.result = response;
  }

  socket.send(JSON.stringify(message));
  return null;
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
