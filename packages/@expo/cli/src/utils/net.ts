import type { IncomingHttpHeaders } from 'node:http';
import { BlockList, isIP, type Socket } from 'node:net';

const ipv6To4Prefix = '::ffff:';

export type SocketRemoteFamily = 'IPv4' | 'IPv6';

export interface SocketTrustOptions {
  trustedProxyCIDRs?: readonly string[];
}

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

export const isTrustedDevServerSocket = (
  socket: Socket,
  options: SocketTrustOptions = {}
): boolean => {
  return isLocalSocket(socket) || isTrustedProxySocket(socket, options);
};

function isTrustedProxySocket(socket: Socket, options: SocketTrustOptions): boolean {
  if (!socket.remoteAddress || !options.trustedProxyCIDRs?.length) {
    return false;
  }

  const blockList = createTrustedProxyBlockList(options.trustedProxyCIDRs);
  if (!blockList) {
    return false;
  }

  const ipVersion = isIP(socket.remoteAddress);
  if (ipVersion === 0) {
    return false;
  }

  try {
    return blockList.check(socket.remoteAddress, ipVersion === 4 ? 'ipv4' : 'ipv6');
  } catch {
    return false;
  }
}

function createTrustedProxyBlockList(cidrs: readonly string[]): BlockList | null {
  const blockList = new BlockList();
  let hasValidCIDR = false;

  for (const cidr of cidrs) {
    const [address, prefixLengthString] = cidr.trim().split('/');
    const prefixLength = Number(prefixLengthString);
    const ipVersion = isIP(address ?? '');

    if (
      !address ||
      !Number.isInteger(prefixLength) ||
      ipVersion === 0 ||
      prefixLength < 0 ||
      prefixLength > (ipVersion === 4 ? 32 : 128)
    ) {
      continue;
    }

    blockList.addSubnet(address, prefixLength, ipVersion === 4 ? 'ipv4' : 'ipv6');
    hasValidCIDR = true;
  }

  return hasValidCIDR ? blockList : null;
}

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
