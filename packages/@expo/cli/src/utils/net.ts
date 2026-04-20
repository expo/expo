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
  const actualHost = new URL(`${request.headers.origin}`).host;
  const expectedHost = new URL(serverBaseUrl).host;
  return actualHost === expectedHost;
};
