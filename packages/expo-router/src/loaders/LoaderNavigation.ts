import type { ReactNavigationState } from '../global-state/types';
import type { LoaderContextValue } from './LoaderContext';

function abandonLoaderPath({ client, store }: LoaderContextValue, path: string) {
  const entry = store.get(path);
  if (entry === undefined) {
    return;
  }

  if (entry instanceof Promise) {
    client.abandon(path);
  } else if (client.hasSubscribers(path)) {
    return;
  }
  if (store.get(path) === entry) {
    store.clear(path);
  }
}

export function trackLoaderRoute(contextValue: LoaderContextValue, path: string, routeKey: string) {
  const abandonedPath = contextValue.client.trackRoute(path, routeKey);
  if (abandonedPath) {
    abandonLoaderPath(contextValue, abandonedPath);
  }
}

export function sweepLoaderRoutes(
  contextValue: LoaderContextValue,
  state: ReactNavigationState | undefined
) {
  const presentKeys = new Set<string>();
  const walk = (node: ReactNavigationState | undefined) => {
    for (const route of node?.routes ?? []) {
      if (route.key) {
        presentKeys.add(route.key);
      }
      walk(route.state);
    }
  };
  walk(state);

  for (const path of contextValue.client.sweepRouteKeys(presentKeys)) {
    abandonLoaderPath(contextValue, path);
  }
}
