import type { NavigationState, PartialState } from '../react-navigation/routers';

export function expectCompleteStateToMatch(
  state: NavigationState | PartialState<NavigationState> | undefined,
  expected: object
): void {
  if (!state) {
    throw new Error('Expected navigation state');
  }
  assertCompleteState(state);
  expect(state).toMatchObject(expected);
}

function assertCompleteState(state: NavigationState | PartialState<NavigationState>): void {
  expect(state).toMatchObject({
    stale: false,
    key: expect.any(String),
    index: expect.any(Number),
    routeNames: expect.any(Array),
    routes: expect.any(Array),
  });

  for (const route of state.routes) {
    expect(route.key).toEqual(expect.any(String));
    if (route.state) {
      assertCompleteState(route.state);
    }
  }
}
