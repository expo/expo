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
