import { lanNetworkSync, lanNetwork } from 'lan-network';

import { envIsHeadless } from './env';

// NOTE(@kitten): In headless mode, there's no point in trying to run DHCP, since
// we assume we're online and probing is going to be enough
const options = {
  noDhcp: envIsHeadless(),
};

export interface GatewayInfo {
  iname: string | null;
  address: string;
  gateway: string | null;
  internal: boolean;
}

export function getGateway(): GatewayInfo {
  try {
    return lanNetworkSync(options);
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
    return await lanNetwork(options);
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
