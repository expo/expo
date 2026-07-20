import { render } from '@testing-library/react-native';
import * as React from 'react';

import { ReducerRegistryContext, createReducerRegistry } from '../../../global-state/storeContext';
import { StackRouter } from '../../routers';
import { getRouteKey, getStateKey } from '../../routers/getRouteKey';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { Screen } from '../Screen';
import { useNavigationBuilder } from '../useNavigationBuilder';

const rootKey = getStateKey(undefined);
const fooKey = getRouteKey({ stateKey: rootKey, name: 'foo' });
const fooChildKey = getStateKey(fooKey);
const bazKey = getRouteKey({ stateKey: rootKey, name: 'baz' });
const bazChildKey = getStateKey(bazKey);

function TestNavigator(props: any) {
  const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

  return (
    <NavigationContent>{descriptors[state.routes[state.index]!.key]!.render()}</NavigationContent>
  );
}

test('keeps a newer entry when an older registration cleans up', () => {
  const registry = createReducerRegistry();
  const entry1 = { reduce: jest.fn(() => null) };
  const entry2 = { reduce: jest.fn(() => null) };

  registry.addEntry(rootKey, entry1);
  registry.addEntry(rootKey, entry2);
  registry.removeEntry(rootKey, entry1);

  expect(registry.getEntry(rootKey)).toBe(entry2);

  registry.removeEntry(rootKey, entry2);

  expect(registry.getSnapshot()).toHaveLength(0);
});

test('registers fresh router-generated deterministic state keys', () => {
  let registry: React.ContextType<typeof ReducerRegistryContext>;

  function RegistryProbe() {
    registry = React.useContext(ReducerRegistryContext);
    return null;
  }

  render(
    <BaseNavigationContainer
      initialState={{
        stale: false,
        index: 1,
        key: rootKey,
        routeNames: ['foo', 'baz'],
        routes: [
          { key: fooKey, name: 'foo' },
          {
            key: bazKey,
            name: 'baz',
            state: {
              stale: false,
              index: 0,
              key: bazChildKey,
              routeNames: ['qux'],
              routes: [{ key: getRouteKey({ stateKey: bazChildKey, name: 'qux' }), name: 'qux' }],
            },
          },
        ],
      }}>
      <RegistryProbe />
      <TestNavigator initialRouteName="baz">
        <Screen name="foo">{() => null}</Screen>
        <Screen name="baz">
          {() => (
            <TestNavigator>
              <Screen name="qux">{() => null}</Screen>
            </TestNavigator>
          )}
        </Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(registry!.getSnapshot().map(([key]) => key).sort()).toEqual(
    [bazChildKey, rootKey].sort()
  );
});

test('registers mounted navigator reducers by state key without leaking in StrictMode', () => {
  let registry: React.ContextType<typeof ReducerRegistryContext>;
  const initialState = {
    stale: false,
    index: 1,
    key: rootKey,
    routeNames: ['foo', 'baz'],
    routes: [
      {
        key: fooKey,
        name: 'foo',
        state: {
          stale: false,
          index: 0,
          key: fooChildKey,
          routeNames: ['bar'],
          routes: [{ key: getRouteKey({ stateKey: fooChildKey, name: 'bar' }), name: 'bar' }],
        },
      },
      {
        key: bazKey,
        name: 'baz',
        state: {
          stale: false,
          index: 0,
          key: bazChildKey,
          routeNames: ['qux'],
          routes: [{ key: getRouteKey({ stateKey: bazChildKey, name: 'qux' }), name: 'qux' }],
        },
      },
    ],
  };

  function RegistryProbe() {
    registry = React.useContext(ReducerRegistryContext);
    return null;
  }

  const result = render(
    <React.StrictMode>
      <BaseNavigationContainer initialState={initialState}>
        <RegistryProbe />
        <TestNavigator>
          <Screen name="foo">
            {() => (
              <TestNavigator>
                <Screen name="bar">{() => null}</Screen>
              </TestNavigator>
            )}
          </Screen>
          <Screen name="baz">
            {() => (
              <TestNavigator>
                <Screen name="qux">{() => null}</Screen>
              </TestNavigator>
            )}
          </Screen>
        </TestNavigator>
      </BaseNavigationContainer>
    </React.StrictMode>
  );

  const reducers = registry!.getSnapshot();
  const keys = reducers.map(([key]) => key).sort();

  expect(keys).toEqual([bazChildKey, rootKey].sort());
  expect(keys).not.toContain(fooChildKey);
  expect(new Set(keys).size).toBe(2);
  expect(reducers).toHaveLength(2);
  expect(reducers.every(([, entry]) => typeof entry.reduce === 'function')).toBe(true);
  expect(reducers.every(([, entry]) => typeof entry.shouldPreventRemove === 'function')).toBe(true);

  result.unmount();

  expect(registry!.getSnapshot()).toHaveLength(0);
});
