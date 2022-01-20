import internalIp from 'internal-ip';

export function getIpAddressAsync(): string {
  return internalIp.v4.sync() || '127.0.0.1';
}
