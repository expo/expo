import { getDrawerStatusFromState } from '../getDrawerStatusFromState';

test('tolerates missing drawer history in stale state', () => {
  const state = {
    key: 'drawer',
    routes: [],
  } as unknown as Parameters<typeof getDrawerStatusFromState>[0];

  expect(getDrawerStatusFromState(state)).toBe('closed');
});

test('throws for fresh drawer state missing history', () => {
  // The cast creates the malformed runtime state that the diagnostic guards against.
  const state = {
    stale: false,
    type: 'drawer',
    key: 'drawer',
    index: 0,
    routeNames: [],
    routes: [],
    default: 'closed',
    preloadedRouteKeys: [],
  } as unknown as Parameters<typeof getDrawerStatusFromState>[0];

  expect(() => getDrawerStatusFromState(state)).toThrow(
    "Couldn't find the drawer status in the state object"
  );
});
