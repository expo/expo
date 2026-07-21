import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import {
  asReconcileRouteNamesAction,
  type DefaultRouterOptions,
  type NavigationState,
  type ParamListBase,
  StackRouter,
} from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { useNavigationBuilder } from '../useNavigationBuilder';
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
    // it if it ever runs during the render phase (it must not — the action is dispatched from an
    // effect).
    getStateForAction(...args: Parameters<typeof router.getStateForAction>) {
      const reconcile = asReconcileRouteNamesAction(args[1]);
      if (isBuildingNavigator && reconcile) {
        renderPhaseCalls.push('getStateForRouteNamesChange');
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
