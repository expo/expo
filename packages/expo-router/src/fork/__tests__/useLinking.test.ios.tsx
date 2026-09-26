import { expect, jest, test } from '@jest/globals';
import { act, type RenderResult } from '@testing-library/react-native';
import { Text } from 'react-native';

import { node } from '../../global-state/__tests__/__fixtures__/routeNode';
import { completeParsedState } from '../../global-state/createSeededNavigationState';
import { getRouteInfoFromState } from '../../global-state/getRouteInfoFromState';
import { getStateFromPath } from '../../link/linking';
import { createNavigationContainerRef, type ParamListBase } from '../../react-navigation/core';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import { getMockConfig } from '../../testing-library/mock-config';
import { NavigationContainer } from '../NavigationContainer';
import { useLinking } from '../useLinking';
import { getPendingIntents, render, renderHook, setRouteNode } from './__fixtures__/store';

let errorSpy: jest.SpiedFunction<typeof console.error> | undefined;

function getParsedHomeState() {
  return {
    routes: [
      {
        name: '__root',
        state: { routes: [{ name: 'home', state: { routes: [{ name: '[id]' }] } }] },
      },
    ],
  };
}

beforeEach(() => {
  setRouteNode(node('root', [node('home', [node('[id]')])]));
});

afterEach(() => {
  errorSpy?.mockRestore();
});

test('queues an incoming deep link using its extracted app path', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  // Only `getRootState` is used by the linking subscription.
  ref.current = {
    getRootState: () => ({ routeNames: ['home'], routes: [{ name: '__root' }] }),
  } as typeof ref.current;
  let listener: ((url: string) => void) | undefined;
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));

  function Sample() {
    useLinking(ref, {
      prefixes: ['example://'],
      getStateFromPath,
      subscribe: (nextListener) => {
        listener = nextListener;
        return () => {};
      },
    });
    return null;
  }

  await render(<Sample />);
  await act(() => listener?.('example://home?from=link'));

  expect(getStateFromPath).toHaveBeenCalledWith('home?from=link', undefined, []);
  expect(getPendingIntents()).toEqual([
    {
      type: 'NAVIGATE_TO_HREF',
      payload: {
        href: '/home?from=link',
        originalHref: 'example://home?from=link',
        options: { event: 'NAVIGATE' },
      },
    },
  ]);
});

test('keeps the current route group when parsing an incoming deep link', async () => {
  const config = getMockConfig(['(a)/shared', '(b)/shared', '(a)/index', '(b)/other']);
  const currentState = completeParsedState(
    getStateFromPath('/other', config, ['(b)', 'other']),
    ROOT_CHAIN
  );
  expect(getRouteInfoFromState(currentState).segments).toEqual(['(b)', 'other']);
  const ref = createNavigationContainerRef<ParamListBase>();
  ref.current = {
    getRootState: () => currentState,
  } as typeof ref.current;
  let listener: ((url: string) => void) | undefined;
  const parsePath = jest.fn(getStateFromPath);

  function Sample() {
    useLinking(ref, {
      prefixes: ['example://'],
      config,
      getStateFromPath: parsePath,
      subscribe: (nextListener) => {
        listener = nextListener;
        return () => {};
      },
    });
    return null;
  }

  await render(<Sample />);
  await act(() => listener?.('example://shared'));

  expect(parsePath).toHaveBeenCalledWith('shared', config, ['(b)', 'other']);
  expect(
    getRouteInfoFromState(getStateFromPath('/shared', config, ['(b)', 'other'])).segments
  ).toEqual(['(b)', 'shared']);
});

test('resolves a completed state from an async initial URL', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const getStateFromPath = jest.fn(() => ({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'home',
              state: { routes: [{ name: '[id]', path: '/home/42', params: { id: '42' } }] },
            },
          ],
        },
      },
    ],
  }));

  const { result } = await renderHook(() =>
    useLinking(ref, {
      prefixes: ['example://'],
      getInitialURL: () => Promise.resolve('example://home/42'),
      getStateFromPath,
    })
  );

  const state = await result.current.getInitialState();

  expect(getStateFromPath).toHaveBeenCalledWith('/home/42', undefined);
  expect(state?.routes[0]!.state?.routes[0]!.state).toMatchObject({
    stale: false,
    routeKeySeq: expect.any(Number),
    key: expect.any(String),
    routeNames: ['[id]'],
  });
});

test('resubscribes on re-render and cleans up the previous subscription', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  // Only `getRootState` is used by the linking subscription.
  ref.current = {
    getRootState: () => ({ routeNames: ['home'], routes: [{ name: '__root' }] }),
  } as typeof ref.current;
  const listeners: ((url: string) => void)[] = [];
  const unsubscribes = [jest.fn(), jest.fn()];
  const subscribe = jest.fn((listener: (url: string) => void) => {
    listeners.push(listener);
    return unsubscribes[listeners.length - 1]!;
  });

  function Sample() {
    useLinking(ref, {
      prefixes: ['example://'],
      getStateFromPath: () => ({ routes: [{ name: 'home' }] }),
      subscribe,
    });
    return null;
  }

  const element = await render(<Sample />);
  await element.rerender(<Sample />);
  await act(() => listeners[1]?.('example://home'));

  expect(subscribe).toHaveBeenCalledTimes(2);
  expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
  expect(unsubscribes[1]).not.toHaveBeenCalled();
  expect(getPendingIntents()).toMatchObject([
    { type: 'NAVIGATE_TO_HREF', payload: { href: '/home' } },
  ]);
});

test('async initial URL is parsed with first-render options', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  let resolveInitialURL: ((url: string) => void) | undefined;
  const initialURL = new Promise<string>((resolve) => {
    resolveInitialURL = resolve;
  });
  const firstGetStateFromPath = jest.fn(getParsedHomeState);
  const secondGetStateFromPath = jest.fn(getParsedHomeState);
  let getInitialState: ReturnType<typeof useLinking>['getInitialState'] | undefined;

  function Sample({ getStateFromPath }: { getStateFromPath: typeof firstGetStateFromPath }) {
    getInitialState = useLinking(ref, {
      prefixes: ['example://'],
      getInitialURL: () => initialURL,
      getStateFromPath,
    }).getInitialState;
    return null;
  }

  const element = await render(<Sample getStateFromPath={firstGetStateFromPath} />);
  const statePromise = getInitialState?.();
  await element.rerender(<Sample getStateFromPath={secondGetStateFromPath} />);
  resolveInitialURL?.('example://home');
  await statePromise;

  expect(firstGetStateFromPath).toHaveBeenCalledWith('/home', undefined);
  expect(secondGetStateFromPath).not.toHaveBeenCalled();
});

test('preserves seeded state on rerender', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  const element = await render(
    <NavigationContainer
      ref={ref}
      linking={{
        prefixes: ['example://'],
        getInitialURL: () => 'example://home',
        getStateFromPath: getParsedHomeState,
      }}>
      {null}
    </NavigationContainer>
  );
  const seededState = ref.getRootState();

  await element.rerender(
    <NavigationContainer
      ref={ref}
      linking={{
        prefixes: ['example://'],
        getInitialURL: () => 'example://home',
        getStateFromPath: getParsedHomeState,
      }}>
      {null}
    </NavigationContainer>
  );

  expect(ref.getRootState()).toBe(seededState);
});

test('renders children on first paint with a synchronous initial URL and no initialState prop', async () => {
  const element = await render(
    <NavigationContainer
      fallback={<Text testID="loading">Loading</Text>}
      linking={{
        prefixes: ['example://'],
        getInitialURL: () => 'example://home',
        getStateFromPath: getParsedHomeState,
      }}>
      <Text testID="content">Content</Text>
    </NavigationContainer>
  );

  expect(element.getByTestId('content')).toBeTruthy();
  expect(element.queryByTestId('loading')).toBeNull();
});

test('shows fallback then content for an async initial URL', async () => {
  let resolveInitialURL: ((url: string) => void) | undefined;
  const initialURL = new Promise<string>((resolve) => {
    resolveInitialURL = resolve;
  });
  const linking = {
    prefixes: ['example://'],
    getInitialURL: () => initialURL,
    getStateFromPath: getParsedHomeState,
  };
  const element = await render(
    <NavigationContainer fallback={<Text testID="loading">Loading</Text>} linking={linking}>
      <Text testID="content">Content</Text>
    </NavigationContainer>
  );

  expect(element.getByTestId('loading')).toBeTruthy();
  await act(async () => resolveInitialURL?.('example://home'));
  expect(element.getByTestId('content')).toBeTruthy();
});

test('seeds navigation state when a synchronous initial URL is absent', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  await render(
    <NavigationContainer ref={ref} linking={{ prefixes: [], getInitialURL: () => null }}>
      {null}
    </NavigationContainer>
  );

  expect(ref.getRootState()).toMatchObject({
    stale: false,
    routeKeySeq: expect.any(Number),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        name: '__root',
        state: { stale: false, routeNames: ['home'], routes: [{ name: 'home' }] },
      },
    ],
  });
  expect(getRouteInfoFromState(ref.getRootState()).pathname).toBe('/home');
});

test('throws when linking does not produce an initial state', async () => {
  setRouteNode(null);

  await expect(async () =>
    render(
      <NavigationContainer linking={{ prefixes: [], getInitialURL: () => null }}>
        {null}
      </NavigationContainer>
    )
  ).rejects.toThrow(
    'Linking did not produce an initial navigation state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
  );
});

test('throws if multiple instances of useLinking are used', async () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const options = { prefixes: [] };

  function Sample() {
    useLinking(ref, options);
    useLinking(ref, options);
    return null;
  }

  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  let element: RenderResult | undefined;

  element = await render(<Sample />);

  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0]![0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  await element?.unmount();

  function A() {
    useLinking(ref, options);
    return null;
  }

  function B() {
    useLinking(ref, options);
    return null;
  }

  element = await render(
    <>
      <A />
      <B />
    </>
  );

  expect(errorSpy).toHaveBeenCalledTimes(2);
  expect(errorSpy.mock.calls[1]![0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  await element?.unmount();

  function Sample2() {
    useLinking(ref, options);
    return null;
  }

  const wrapper2 = <Sample2 />;

  await (await render(wrapper2)).unmount();

  element = await render(wrapper2);

  expect(errorSpy).toHaveBeenCalledTimes(2);

  await element?.unmount();
});
