import type { InitialState } from '@react-navigation/routers';

type Result =
  | {
      key?: string;
      name: string;
      params?: object;
      path?: string;
    }
  | undefined;

export function findFocusedRoute(state: InitialState): Result {
  let current: InitialState | undefined = state;

  while (current?.routes[current.index ?? 0].state != null) {
    current = current.routes[current.index ?? 0].state;
  }

  const route = current?.routes[current?.index ?? 0];

  return route;
}
