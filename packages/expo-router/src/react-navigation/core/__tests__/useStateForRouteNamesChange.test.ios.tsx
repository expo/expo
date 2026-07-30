import { expect, test } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import { CommonActions, StackRouter } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { useStateForRouteNamesChange } from '../useStateForRouteNamesChange';

const TestNavigator = (props: any) => {
  const {
    state: builderState,
    descriptors,
    navigation,
    NavigationContent,
    routeNames,
  } = useNavigationBuilder(StackRouter, props);

  const state = useStateForRouteNamesChange({ state: builderState, routeNames, navigation });

  return (
    <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
  );
};

test('reconciles the state when a route name is removed', () => {
  const ref = createNavigationContainerRef<Record<string, undefined>>();

  const { rerender } = render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() =>
    rerender(
      <BaseNavigationContainer ref={ref}>
        <TestNavigator>
          <Screen name="foo" component={React.Fragment} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();

  const state = ref.getRootState();

  expect(state.routeNames).toEqual(['foo']);
  expect(state.routes.map((route) => route.name)).toEqual(['foo']);
});

test('preserves the navigator key and surviving routes for a committed state', () => {
  const ref = createNavigationContainerRef<Record<string, undefined>>();

  const { rerender } = render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
        <Screen name="bar" component={React.Fragment} />
        <Screen name="baz" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  // Commit the state before the route names change.
  act(() => {
    ref.dispatch(CommonActions.navigate('bar'));
  });

  const previousState = ref.getRootState();

  expect(() =>
    rerender(
      <BaseNavigationContainer ref={ref}>
        <TestNavigator>
          <Screen name="foo" component={React.Fragment} />
          <Screen name="bar" component={React.Fragment} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();

  const state = ref.getRootState();

  expect(state.routeNames).toEqual(['foo', 'bar']);
  expect(state.routes.map((route) => route.name)).toEqual(['foo', 'bar']);
  // The navigator key and the surviving route keys survive the reconciliation.
  expect(state.key).toBe(previousState.key);
  expect(state.routes.map((route) => route.key)).toEqual(
    previousState.routes.map((route) => route.key)
  );
  expect(state.index).toBe(1);
});

test('resets to the initial route when every route name is replaced', () => {
  const ref = createNavigationContainerRef<Record<string, undefined>>();

  const { rerender } = render(
    <BaseNavigationContainer ref={ref}>
      <TestNavigator>
        <Screen name="foo" component={React.Fragment} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(() =>
    rerender(
      <BaseNavigationContainer ref={ref}>
        <TestNavigator>
          <Screen name="bar" component={React.Fragment} />
        </TestNavigator>
      </BaseNavigationContainer>
    )
  ).not.toThrow();

  const state = ref.getRootState();

  expect(state.routeNames).toEqual(['bar']);
  expect(state.routes.map((route) => route.name)).toEqual(['bar']);
});
