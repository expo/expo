import type { NavigationState } from './types';

export const ROOT_CHAIN = 'root';

export function createNavigatorStateKey(parentChain: string): string {
  return `navigator:${parentChain}`;
}

export function getChainFromRouteKey(routeKey: string): string {
  const separatorIndex = routeKey.lastIndexOf(':');
  if (process.env.NODE_ENV !== 'production' && separatorIndex === -1) {
    console.warn(
      `The route key "${routeKey}" has no chain separator. Expo Router-generated route keys include a ":" separator.`
    );
  }
  return routeKey.slice(separatorIndex + 1);
}

export function getChainFromStateKey(stateKey: string): string {
  return stateKey.slice('navigator:'.length);
}

export function createRouteKeyMinter(state: Pick<NavigationState, 'key' | 'routeKeySeq'>): {
  mint: (name: string) => string;
  readonly routeKeySeq: number;
} {
  const parentChain = getChainFromStateKey(state.key);
  let routeKeySeq = state.routeKeySeq;

  return {
    mint(name) {
      const chain = parentChain === ROOT_CHAIN ? `${routeKeySeq}` : `${parentChain}-${routeKeySeq}`;
      routeKeySeq += 1;
      return `${name}:${chain}`;
    },
    get routeKeySeq() {
      return routeKeySeq;
    },
  };
}
