import { act, render } from '@testing-library/react-native';

import type { NavigationState, ParamListBase } from '../../routers';
import { BaseNavigationContainer } from '../BaseNavigationContainer';
import { NavigationIndependentTree } from '../NavigationIndependentTree';
import { Screen } from '../Screen';
import { createNavigationContainerRef } from '../createNavigationContainerRef';
import { getCachedSlice, useStoreSlice } from '../useStoreSlice';
import { useNavigationBuilder } from '../useNavigationBuilder';
import { MockRouter, MockRouterKey } from './__fixtures__/MockRouter';

beforeEach(() => {
  MockRouterKey.current = 0;
});

const childState = {
  stale: false,
  key: 'child',
  index: 0,
  routeNames: ['baz'],
  routes: [{ key: 'baz', name: 'baz' }],
} satisfies NavigationState;

const rootState = {
  stale: false,
  key: 'root',
  index: 0,
  routeNames: ['foo', 'bar'],
  routes: [
    {
      key: 'foo',
      name: 'foo',
      state: childState,
    },
    { key: 'bar', name: 'bar' },
  ],
} satisfies NavigationState;

test('returns cached slices by root tree identity and state key', () => {
  expect(getCachedSlice(rootState, 'root')).toBe(rootState);
  expect(getCachedSlice(rootState, 'child')).toBe(childState);
  expect(getCachedSlice(rootState, 'child')).toBe(childState);
});

test('does not share cached slices across root tree identities', () => {
  const nextChildState = {
    ...childState,
    routes: [{ key: 'qux', name: 'qux' }],
  } satisfies NavigationState;
  const nextRootState = {
    ...rootState,
    routes: [
      {
        key: 'foo',
        name: 'foo',
        state: nextChildState,
      },
      { key: 'bar', name: 'bar' },
    ],
  } satisfies NavigationState;

  expect(getCachedSlice(rootState, 'child')).toBe(childState);
  expect(getCachedSlice(nextRootState, 'child')).toBe(nextChildState);
});

test('returns undefined for missing, partial, or absent root state', () => {
  expect(getCachedSlice(rootState, 'missing')).toBeUndefined();
  expect(getCachedSlice(undefined, 'root')).toBeUndefined();
  expect(getCachedSlice({ routes: [], stale: true }, 'root')).toBeUndefined();
});

test('subscribes to the nearest container store', () => {
  const TestNavigator = (props: any): any => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(MockRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };

  const callback = jest.fn();
  const Probe = () => {
    callback(useStoreSlice('0')?.index);
    return null;
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <BaseNavigationContainer
      ref={navigation}
      initialState={
        {
          stale: false,
          key: '0',
          index: 0,
          routeNames: ['first', 'second'],
          routes: [
            { key: 'first', name: 'first' },
            { key: 'second', name: 'second' },
          ],
        } as NavigationState
      }>
      <Probe />
      <TestNavigator>
        <Screen name="first">{() => null}</Screen>
        <Screen name="second">{() => null}</Screen>
      </TestNavigator>
    </BaseNavigationContainer>
  );

  expect(callback).toHaveBeenCalledWith(0);

  act(() => navigation.current?.navigate('second'));

  expect(callback).toHaveBeenLastCalledWith(1);
});

test('reads slices from independent nested containers without leaking the parent store', () => {
  const callback = jest.fn();
  const Probe = ({ label }: { label: string }) => {
    callback(label, useStoreSlice('0')?.routes[0]?.name);
    return null;
  };

  render(
    <BaseNavigationContainer
      initialState={
        {
          stale: false,
          key: '0',
          index: 0,
          routeNames: ['outer'],
          routes: [{ key: 'outer', name: 'outer' }],
        } as NavigationState
      }>
      <Probe label="outer" />
      <NavigationIndependentTree>
        <BaseNavigationContainer
          initialState={
            {
              stale: false,
              key: '0',
              index: 0,
              routeNames: ['inner'],
              routes: [{ key: 'inner', name: 'inner' }],
            } as NavigationState
          }>
          <Probe label="inner" />
        </BaseNavigationContainer>
      </NavigationIndependentTree>
    </BaseNavigationContainer>
  );

  expect(callback).toHaveBeenCalledWith('outer', 'outer');
  expect(callback).toHaveBeenCalledWith('inner', 'inner');
});

test('throws outside a navigation store provider, including an independent tree boundary', () => {
  const Probe = () => {
    useStoreSlice('0');
    return null;
  };

  expect(() => render(<Probe />)).toThrow(
    "Couldn't find a navigation store. Is your component inside a navigator?"
  );

  expect(() =>
    render(
      <BaseNavigationContainer>
        <NavigationIndependentTree>
          <Probe />
        </NavigationIndependentTree>
      </BaseNavigationContainer>
    )
  ).toThrow("Couldn't find a navigation store. Is your component inside a navigator?");
});
