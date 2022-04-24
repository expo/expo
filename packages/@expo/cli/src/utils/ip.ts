import internalIp from 'internal-ip';

export function getIpAddress(): string {
  return internalIp.v4.sync() || '127.0.0.1';
}
