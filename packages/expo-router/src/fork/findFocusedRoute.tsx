// Forked so we can access without importing any React Native code in Node.js environments.

import type { InitialState } from "@react-navigation/routers";

export function findFocusedRoute(state: InitialState) {
  let current: InitialState | undefined = state;

  while (current?.routes[current.index ?? 0].state != null) {
    current = current.routes[current.index ?? 0].state;
  }

  const route = current?.routes[current?.index ?? 0];

  return route;
}
