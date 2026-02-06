import { lanNetworkSync, lanNetwork } from 'lan-network';

export interface GatewayInfo {
  iname: string | null;
  address: string;
  gateway: string | null;
  internal: boolean;
}

export function getGateway(): GatewayInfo {
  try {
    return lanNetworkSync();
  } catch {
    return {
      iname: null,
      address: '127.0.0.1',
      gateway: null,
      internal: true,
    };
  }
}

export async function getGatewayAsync(): Promise<GatewayInfo> {
  try {
    return await lanNetwork();
  } catch {
    return {
      iname: null,
      address: '127.0.0.1',
      gateway: null,
      internal: true,
    };
  }
}

export async function getIpAddressAsync(): Promise<string> {
  return (await getGatewayAsync()).address;
}
