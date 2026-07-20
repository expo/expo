import { jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  asReconcileRouteNamesAction,
  type DefaultRouterOptions,
  isUnhandledStateRestore,
  type NavigationState,
  type ParamListBase,
  StackRouter,
} from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { usePreventRemove } from '../usePreventRemove';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

let isBuildingNavigator = false;
const renderPhaseCalls: string[] = [];

beforeEach(() => {
  MockRouterKey.current = 0;
  isBuildingNavigator = false;
  renderPhaseCalls.length = 0;
});

function PhaseProbeMockRouter(options: DefaultRouterOptions) {
  const router = MockRouter(options);

  return {
    ...router,
    // Route-names reconciliation is now a `RECONCILE_ROUTE_NAMES` case of `getStateForAction`. Record
    // which branch fires if it ever runs during the render phase (it must not — the action is
    // dispatched from an effect). The unhandled-state-restore branch stands in for the former
    // `getRehydratedState`; the route-names-change branch for `getStateForRouteNamesChange`.
    getStateForAction(...args: Parameters<typeof router.getStateForAction>) {
      const reconcile = asReconcileRouteNamesAction(args[1]);
      if (isBuildingNavigator && reconcile) {
        const config = reconcile.payload;
        renderPhaseCalls.push(
          isUnhandledStateRestore(args[0], config.routeNames, config.unhandledState)
            ? 'getRehydratedState'
            : 'getStateForRouteNamesChange'
        );
      }

      return router.getStateForAction(...args);
    },
  };
}

function TestNavigator(props: any) {
  isBuildingNavigator = true;
  const { state, descriptors, NavigationContent } = useNavigationBuilder(
    PhaseProbeMockRouter,
    props
  );
  isBuildingNavigator = false;

  return (
    <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
  );
}

function StackNavigator(props: { children: React.ReactNode }) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

  return (
    <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
  );
}

test('reconciles removed route names outside useNavigationBuilder render', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const initialState: NavigationState = {
    stale: false,
    key: '0',
    index: 1,
    routeNames: ['first', 'second'],
    routes: [
      { key: 'first', name: 'first' },
      { key: 'second', name: 'second' },
    ],
  };

  const TestScreen = ({ route }: any) => `[${route.name}]`;

  const root = render(
    <BaseNavigationContainer ref={ref} initialState={initialState}>
      <TestNavigator>
        <Screen name="first" component={TestScreen} />
        <Screen name="second" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`"[second]"`);

  renderPhaseCalls.length = 0;

  act(() => {
    root.update(
      <BaseNavigationContainer ref={ref}>
        <TestNavigator>
          <Screen name="first" component={TestScreen} />
        </TestNavigator>
      </BaseNavigationContainer>
    );
  });

  expect(renderPhaseCalls).not.toContain('getStateForRouteNamesChange');
  expect(ref.current?.getRootState()).toEqual({
    stale: false,
    key: '0',
    index: 0,
    routeNames: ['first'],
    routes: [{ key: 'first', name: 'first' }],
  });
  expect(root).toMatchInlineSnapshot(`"[first]"`);
});

test('restores lastUnhandled route names outside useNavigationBuilder render', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const onStateChange = jest.fn();
  const initialState: NavigationState = {
    stale: false,
    key: '0',
    index: 0,
    routeNames: ['foo', 'bar', 'baz'],
    routes: [{ key: 'foo', name: 'foo' }],
  };

  const TestScreen = ({ route }: any) => `[${route.name}]`;

  const root = render(
    <BaseNavigationContainer ref={ref} initialState={initialState} onStateChange={onStateChange}>
      <TestNavigator UNSTABLE_routeNamesChangeBehavior="lastUnhandled">
        <Screen name="foo" component={TestScreen} />
        <Screen name="bar" component={TestScreen} />
        <Screen name="baz" component={TestScreen} />
      </TestNavigator>
    </BaseNavigationContainer>
  );

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  act(() => ref.current?.navigate('qux'));

  spy.mockRestore();
  renderPhaseCalls.length = 0;

  act(() => {
    root.update(
      <BaseNavigationContainer ref={ref} onStateChange={onStateChange}>
        <TestNavigator UNSTABLE_routeNamesChangeBehavior="lastUnhandled">
          <Screen name="bar" component={TestScreen} />
          <Screen name="baz" component={TestScreen} />
          <Screen name="qux" component={TestScreen} />
        </TestNavigator>
      </BaseNavigationContainer>
    );
  });

  expect(renderPhaseCalls).not.toContain('getRehydratedState');
  expect(ref.current?.getRootState()).toEqual(
    expect.objectContaining({
      stale: false,
      index: 0,
      routeNames: ['bar', 'baz', 'qux'],
      routes: [expect.objectContaining({ key: 'qux-0', name: 'qux' })],
    })
  );
  expect(root).toMatchInlineSnapshot(`"[qux]"`);
});

test('route-name reconciliation bypasses beforeRemove prevention', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const onPreventRemove = jest.fn();

  function PreventedScreen() {
    usePreventRemove(true, onPreventRemove);

    return null;
  }

  const root = render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        stale: false as const,
        index: 0,
        key: '@',
        routeNames: ['first', 'second'],
        routes: [{ key: '@:first:0', name: 'first' }],
      }}>
      <StackNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second" component={PreventedScreen} />
      </StackNavigator>
    </BaseNavigationContainer>
  );

  act(() => ref.current?.navigate('second'));

  act(() => {
    root.update(
      <BaseNavigationContainer ref={ref}>
        <StackNavigator>
          <Screen name="first">{() => null}</Screen>
        </StackNavigator>
      </BaseNavigationContainer>
    );
  });

  expect(onPreventRemove).not.toHaveBeenCalled();
  expect(ref.current?.getRootState()?.routes).toEqual([
    expect.objectContaining({ name: 'first' }),
  ]);
});

test('reconciles route key changes for an unchanged route name', () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const TestScreen = ({ route }: any) => `[${route.params?.version}]`;

  const root = render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        stale: false as const,
        index: 0,
        key: '@',
        routeNames: ['first'],
        routes: [{ key: '@:first:0', name: 'first', params: { version: 'old' } }],
      }}>
      <StackNavigator>
        <Screen
          name="first"
          navigationKey="old"
          component={TestScreen}
          initialParams={{ version: 'old' }}
        />
      </StackNavigator>
    </BaseNavigationContainer>
  );

  expect(root).toMatchInlineSnapshot(`"[old]"`);

  act(() => {
    root.update(
      <BaseNavigationContainer ref={ref}>
        <StackNavigator>
          <Screen
            name="first"
            navigationKey="new"
            component={TestScreen}
            initialParams={{ version: 'new' }}
          />
        </StackNavigator>
      </BaseNavigationContainer>
    );
  });

  expect(root).toMatchInlineSnapshot(`"[new]"`);
  expect(ref.current?.getRootState()?.routes).toEqual([
    expect.objectContaining({
      name: 'first',
      params: { version: 'new' },
    }),
  ]);
});
