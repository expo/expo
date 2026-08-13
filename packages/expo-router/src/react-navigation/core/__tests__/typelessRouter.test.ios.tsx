import { render, screen } from '@testing-library/react-native';
import { use } from 'react';
import { Text } from 'react-native';

import type {
  DefaultRouterOptions,
  InitialState,
  NavigationState,
  ParamListBase,
} from '../../routers';
import { NavigatorTypeContext } from '../NavigatorTypeContext';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { BaseNavigationContainer } from './__fixtures__/BaseNavigationContainer';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

// `MockRouter` with `type` dropped from every state it produces.
function StateWithoutTypeRouter(options: DefaultRouterOptions) {
  const { getInitialState, getRehydratedState, ...router } = MockRouter(options);

  // `MockRouter` always sets a type, so the result is only a `NavigationState` because `type` is optional.
  const omitType = ({ type: _stateType, ...state }: NavigationState) => state as NavigationState;

  return {
    ...router,
    getInitialState: (...args: Parameters<typeof getInitialState>) =>
      omitType(getInitialState(...args)),
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

/** Renders a navigator backed by `TypelessRouter` and returns the state it settles on. */
function renderWithInitialState(initialState: InitialState) {
  const ref = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={ref} initialState={initialState}>
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  return ref.current!.getRootState();
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

test('a persisted state without a type is accepted by a typeless router', () => {
  const state = renderWithInitialState(persistedState);

  expect(state.index).toBe(1);
  expect(state).not.toHaveProperty('type');
});

test('a persisted state with a type is discarded by a typeless router', () => {
  const state = renderWithInitialState({ ...persistedState, type: 'test' });

  expect(state.index).toBe(0);
  expect(state).not.toHaveProperty('type');
});

test('provides the router type when an accepted persisted state has no type', () => {
  function RouterType() {
    return <Text>{use(NavigatorTypeContext)}</Text>;
  }

  const ref = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer ref={ref} initialState={persistedState}>
      <TestNavigator createRouter={StateWithoutTypeRouter}>
        <Screen name="first" component={RouterType} />
        <Screen name="second" component={RouterType} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(ref.current!.getRootState().index).toBe(1);
  expect(screen.getAllByText('test')).toHaveLength(2);
});
