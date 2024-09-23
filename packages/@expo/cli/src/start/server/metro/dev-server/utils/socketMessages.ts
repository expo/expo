import type { RawData as WebSocketRawData } from 'ws';

const debug = require('debug')('expo:metro:dev-server:messages') as typeof console.log;

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

    debug(
      `Received message protocol version did not match supported "${PROTOCOL_VERSION}", received: ${message.version}`
    );
  } catch (error) {
    debug(`Failed to parse message: ${error}`);
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
