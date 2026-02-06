import { lanNetworkSync, lanNetwork } from 'lan-network';

export function getIpAddress(): string {
  try {
    const lan = lanNetworkSync();
    return lan.address;
  } catch {
    return '127.0.0.1';
  }
}

export async function getIpAddressAsync(): Promise<string> {
  try {
    const lan = await lanNetwork();
    return lan.address;
  } catch {
    return '127.0.0.1';
  }
}
