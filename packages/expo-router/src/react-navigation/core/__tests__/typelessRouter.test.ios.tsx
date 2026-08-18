import { render } from '@testing-library/react-native';

import type { DefaultRouterOptions, NavigationState } from '../../routers';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

// `MockRouter` with `type` dropped from every state it produces.
function StateWithoutTypeRouter(options: DefaultRouterOptions) {
  const { getRehydratedState, ...router } = MockRouter(options);

  // `MockRouter` always sets a type, so the result is only a `NavigationState` because `type` is optional.
  const omitType = ({ type: _stateType, ...state }: NavigationState) => state as NavigationState;

  return {
    ...router,
    getRehydratedState: (...args: Parameters<typeof getRehydratedState>) =>
      omitType(getRehydratedState(...args)),
  };
}

// `MockRouter` with `type` dropped from the router and from every state it produces.
function TypelessRouter(options: DefaultRouterOptions) {
  const { type: _type, ...router } = StateWithoutTypeRouter(options);
  return router;
}

function TestNavigator({ createRouter = TypelessRouter, ...props }: any): any {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(createRouter, props);

  return (
    <NavigationContent>
      {state.routes.map((route) => descriptors[route.key]!.render())}
    </NavigationContent>
  );
}

/** A persisted state focusing the second route, so a discarded state is visible as `index: 0`. */
const persistedState = {
  stale: false,
  key: 'persisted',
  index: 1,
  routeNames: ['first', 'second'],
  routes: [
    { key: 'first', name: 'first' },
    { key: 'second', name: 'second' },
  ],
};

test('rejects a persisted state before a typeless router can rehydrate it', () => {
  expect(() =>
    render(
      <BaseNavigationContainer initialState={persistedState}>
        <TestNavigator>
          <Screen name="first">{() => null}</Screen>
          <Screen name="second">{() => null}</Screen>
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).toThrow('The `initialState` prop must contain a partial navigation state.');
});
