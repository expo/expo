import { lanNetworkSync } from 'lan-network';

export function getIpAddress(): string {
  try {
    const lan = lanNetworkSync();
    return lan.address;
  } catch {
    return '127.0.0.1';
  }
}
