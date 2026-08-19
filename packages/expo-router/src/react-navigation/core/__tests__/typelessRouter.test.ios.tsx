import { render } from '@testing-library/react-native';

import type { DefaultRouterOptions, NavigationState } from '../../routers';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

// `MockRouter` with `type` dropped from action results.
function StateWithoutTypeRouter(options: DefaultRouterOptions) {
  const router = MockRouter(options);
  const getStateForAction = router.getStateForAction;

  // `MockRouter` adds `type`, but this fixture intentionally models state without router metadata.
  const omitType = ({ type: _stateType, ...state }: NavigationState) => state as NavigationState;

  return {
    ...router,
    getStateForAction: (...args: Parameters<typeof getStateForAction>) => {
      const result = getStateForAction(...args);

      return result === null
        ? null
        : {
            ...result,
            // MockRouter only returns complete states.
            state: omitType(result.state as NavigationState),
          };
    },
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
  routeKeySeq: 0,
  key: 'persisted',
  index: 1,
  routeNames: ['first', 'second'],
  routes: [
    { key: 'first', name: 'first' },
    { key: 'second', name: 'second' },
  ],
};

test('accepts a complete persisted state for a typeless router', () => {
  expect(() =>
    render(
      <BaseNavigationContainer initialState={persistedState}>
        <TestNavigator>
          <Screen name="first">{() => null}</Screen>
          <Screen name="second">{() => null}</Screen>
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();
});
