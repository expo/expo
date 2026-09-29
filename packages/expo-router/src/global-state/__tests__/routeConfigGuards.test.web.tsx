import { routeConfigGuards } from './routeConfigGuards';

jest.mock('../getPathForState', () => ({
  getPathForState: (state: { routes: { name: string; state?: unknown }[]; index: number }) => {
    let current = state;
    while (current.routes[current.index]?.state)
      current = current.routes[current.index]!.state as typeof state;
    return `/${current.routes[current.index]?.name ?? ''}`;
  },
}));

routeConfigGuards(true);
