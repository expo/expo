import { render } from '@testing-library/react-native';

import type { DefaultRouterOptions, ParamListBase } from '../../routers';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

// `MockRouter` with the router type metadata removed.
function TypelessRouter(options: DefaultRouterOptions) {
  const { type: _type, ...router } = MockRouter(options);
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
  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={navigation} initialState={persistedState}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(navigation.getRootState()).toEqual(persistedState);
});
