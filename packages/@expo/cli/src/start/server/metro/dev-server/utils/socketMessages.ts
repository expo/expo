import type { RawData as WebSocketRawData } from 'ws';

import { event } from '../../hmrEvents';

/** The current websocket-based communication between Metro, CLI, and client devices */
const PROTOCOL_VERSION = 2;

/**
 * Parse the incoming raw message data and return the parsed object.
 * This returns null if the protocol version did not match expected version.
 */
export function parseRawMessage<T = Record<string, any>>(
  data: WebSocketRawData,
  isBinary: boolean
): null | T {
  if (isBinary) return null;

  try {
    const { version, ...message } = JSON.parse(data.toString()) ?? {};
    if (version === PROTOCOL_VERSION) {
      return message;
    }

    event('protocol_version_mismatch', { expected: PROTOCOL_VERSION, received: version });
  } catch (error) {
    event('message_parse_failed', { error: event.error(error as Error) });
  }

  return null;
}

/**
 * Serialize any of the messages to send over websockets.
 * This adds the protocol version to the message.
 */
export function serializeMessage(message: Record<string, any>): string {
  return JSON.stringify({ ...message, version: PROTOCOL_VERSION });
}
