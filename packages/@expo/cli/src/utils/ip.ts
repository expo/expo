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

// NOTE(@kitten): Session caching accepts the unlikely risk of an address change during a native build.
let cachedGateway: GatewayInfo | undefined;
let pendingGateway: Promise<GatewayInfo> | undefined;

export function resetGatewayCache(): void {
  cachedGateway = undefined;
  pendingGateway = undefined;
}

function getLoopbackGateway(): GatewayInfo {
  return { iname: null, address: '127.0.0.1', gateway: null, internal: true };
}

export function getGateway(): GatewayInfo {
  if (cachedGateway) {
    return cachedGateway;
  }
  try {
    cachedGateway = lanNetworkSync(options);
    pendingGateway = undefined;
    return cachedGateway;
  } catch {
    return getLoopbackGateway();
  }
}

export function getGatewayAsync(): Promise<GatewayInfo> {
  if (cachedGateway) {
    return Promise.resolve(cachedGateway);
  }
  if (pendingGateway) {
    return pendingGateway;
  }
  const pending: Promise<GatewayInfo> = Promise.resolve()
    .then(() => lanNetwork(options))
    .then(
      (gateway) => {
        // A reset or synchronous discovery can supersede this request.
        if (pendingGateway === pending) {
          cachedGateway = gateway;
          pendingGateway = undefined;
        }
        return gateway;
      },
      () => {
        if (pendingGateway === pending) {
          pendingGateway = undefined;
        }
        return getLoopbackGateway();
      }
    );
  pendingGateway = pending;
  return pending;
}

export async function getIpAddressAsync(): Promise<string> {
  return (await getGatewayAsync()).address;
}
