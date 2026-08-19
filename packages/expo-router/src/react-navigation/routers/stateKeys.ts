import type { NavigationState } from './types';

export const ROOT_CHAIN = 'root';

export function createNavigatorStateKey(parentChain: string): string {
  return `navigator:${parentChain}`;
}

export function getChainFromRouteKey(routeKey: string): string {
  return routeKey.slice(routeKey.lastIndexOf(':') + 1);
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
