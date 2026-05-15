import type { IncomingHttpHeaders } from 'node:http';
import type { Socket } from 'node:net';

const ipv6To4Prefix = '::ffff:';

export const isLocalSocket = (socket: Socket): boolean => {
  let { localAddress, remoteAddress, remoteFamily } = socket;

  const isLoopbackRequest = localAddress && localAddress === remoteAddress;
  if (isLoopbackRequest) {
    return true;
  } else if (!remoteAddress || !remoteFamily) {
    return false;
  }

  if (remoteFamily === 'IPv6' && remoteAddress.startsWith(ipv6To4Prefix)) {
    remoteAddress = remoteAddress.slice(ipv6To4Prefix.length);
  }

  return remoteAddress === '::1' || remoteAddress.startsWith('127.');
};

interface AbstractIncomingMessage {
  headers: IncomingHttpHeaders | Record<string, string | string[]>;
}

export const isMatchingOrigin = (
  request: AbstractIncomingMessage,
  serverBaseUrl: string
): boolean => {
  // NOTE(@kitten): The browser will always send an origin header for websocket upgrade connections
  if (!request.headers.origin) {
    return true;
  }
  let actualHost: string;
  try {
    actualHost = new URL(`${request.headers.origin}`).host;
  } catch {
    // Malformed Origin — treat as untrusted.
    return false;
  }
  const expectedHost = new URL(serverBaseUrl).host;
  return actualHost === expectedHost;
};

const DEV_CALL_THROTTLE_MS = 2_000;
let lastRemoteDevCallAt = 0;

/** Process-wide throttle. Returns `true` if another call fired within the cooldown window. */
export const shouldThrottleRemoteDevCall = (): boolean => {
  const now = Date.now();
  if (now - lastRemoteDevCallAt < DEV_CALL_THROTTLE_MS) {
    return true;
  }
  lastRemoteDevCallAt = now;
  return false;
};
