import { expect, jest, test } from '@jest/globals';
import { act, type RenderAPI } from '@testing-library/react-native';
import { Text } from 'react-native';

import { node } from '../../global-state/__tests__/__fixtures__/routeNode';
import { routingQueue } from '../../global-state/routingQueue';
import { store, storeRef as mockStoreRef } from '../../global-state/store';
import { createNavigationContainerRef, type ParamListBase } from '../../react-navigation/core';
import { NavigationContainer } from '../NavigationContainer';
import { useLinking } from '../useLinking';
import { render, renderHook } from './__fixtures__/store';

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
  routingQueue.queue = [];
  mockStoreRef.current.routeNode = node('root', [node('home', [node('[id]')])]);
  mockStoreRef.current.state = undefined;
});

afterEach(() => {
  errorSpy?.mockRestore();
});

test('queues an incoming deep link using its extracted app path', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  // Only `getRootState` is used by the linking subscription.
  ref.current = {
    getRootState: () => ({ routeNames: ['home'] }),
  } as typeof ref.current;
  let listener: ((url: string) => void) | undefined;
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));

  function Sample() {
    useLinking(
      ref,
      {
        prefixes: ['example://'],
        getStateFromPath,
        subscribe: (nextListener) => {
          listener = nextListener;
          return () => {};
        },
      },
      () => {}
    );
    return null;
  }

  render(<Sample />);
  listener?.('example://home?from=link');

  expect(getStateFromPath).toHaveBeenCalledWith('home?from=link', undefined, []);
  expect(routingQueue.queue).toEqual([
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

test('reports an incoming deep link using its extracted app path', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  // Only `getRootState` is used by the linking subscription.
  ref.current = {
    getRootState: () => ({ routeNames: ['home'] }),
  } as typeof ref.current;
  let listener: ((url: string) => void) | undefined;
  const onUnhandledLinking = jest.fn();

  function Sample() {
    useLinking(
      ref,
      {
        prefixes: ['myapp://'],
        getStateFromPath: () => ({ routes: [{ name: 'home' }] }),
        subscribe: (nextListener) => {
          listener = nextListener;
          return () => {};
        },
      },
      onUnhandledLinking
    );
    return null;
  }

  render(<Sample />);
  listener?.('myapp://foo/bar');

  expect(onUnhandledLinking).toHaveBeenCalledWith('/foo/bar');
  expect(routingQueue.queue[0]).toMatchObject({
    payload: { href: '/foo/bar' },
  });
});

test('resolves a completed state from an async initial URL without writing to the store', async () => {
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

  const { result } = renderHook(() =>
    useLinking(
      ref,
      {
        prefixes: ['example://'],
        getInitialURL: () => Promise.resolve('example://home/42'),
        getStateFromPath,
      },
      () => {}
    )
  );

  const state = await result.current.getInitialState();

  expect(getStateFromPath).toHaveBeenCalledWith('/home/42', undefined);
  expect(state?.routes[0]!.state?.routes[0]!.state).toMatchObject({
    stale: false,
    routeKeySeq: expect.any(Number),
    key: expect.any(String),
    routeNames: ['[id]'],
  });
  expect(mockStoreRef.current.state).toBeUndefined();
});

test('resubscribes on re-render and cleans up the previous subscription', () => {
  const ref = createNavigationContainerRef<ParamListBase>();
  // Only `getRootState` is used by the linking subscription.
  ref.current = {
    getRootState: () => ({ routeNames: ['home'] }),
  } as typeof ref.current;
  const listeners: ((url: string) => void)[] = [];
  const unsubscribes = [jest.fn(), jest.fn()];
  const subscribe = jest.fn((listener: (url: string) => void) => {
    listeners.push(listener);
    return unsubscribes[listeners.length - 1]!;
  });

  function Sample() {
    useLinking(
      ref,
      {
        prefixes: ['example://'],
        getStateFromPath: () => ({ routes: [{ name: 'home' }] }),
        subscribe,
      },
      () => {}
    );
    return null;
  }

  const element = render(<Sample />);
  element.rerender(<Sample />);
  listeners[1]?.('example://home');

  expect(subscribe).toHaveBeenCalledTimes(2);
  expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
  expect(unsubscribes[1]).not.toHaveBeenCalled();
  expect(routingQueue.queue).toMatchObject([
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
    getInitialState = useLinking(
      ref,
      { prefixes: ['example://'], getInitialURL: () => initialURL, getStateFromPath },
      () => {}
    ).getInitialState;
    return null;
  }

  const element = render(<Sample getStateFromPath={firstGetStateFromPath} />);
  const statePromise = getInitialState?.();
  element.rerender(<Sample getStateFromPath={secondGetStateFromPath} />);
  resolveInitialURL?.('example://home');
  await statePromise;

  expect(firstGetStateFromPath).toHaveBeenCalledWith('/home', undefined);
  expect(secondGetStateFromPath).not.toHaveBeenCalled();
});

test('does not reseed the store when it already holds the seeded state', () => {
  const element = render(
    <NavigationContainer
      linking={{
        prefixes: ['example://'],
        getInitialURL: () => 'example://home',
        getStateFromPath: getParsedHomeState,
      }}>
      {null}
    </NavigationContainer>
  );
  const seededState = mockStoreRef.current.state;

  element.rerender(
    <NavigationContainer
      linking={{
        prefixes: ['example://'],
        getInitialURL: () => 'example://home',
        getStateFromPath: getParsedHomeState,
      }}>
      {null}
    </NavigationContainer>
  );

  expect(mockStoreRef.current.state).toBe(seededState);
});

test('renders children on first paint with a synchronous initial URL and no initialState prop', () => {
  const element = render(
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
  const element = render(
    <NavigationContainer fallback={<Text testID="loading">Loading</Text>} linking={linking}>
      <Text testID="content">Content</Text>
    </NavigationContainer>
  );

  expect(element.getByTestId('loading')).toBeTruthy();
  await act(async () => resolveInitialURL?.('example://home'));
  expect(element.getByTestId('content')).toBeTruthy();
});

test('seeds the store when a synchronous initial URL is absent', () => {
  render(
    <NavigationContainer
      documentTitle={{ enabled: false }}
      linking={{ prefixes: [], getInitialURL: () => null }}>
      {null}
    </NavigationContainer>
  );

  expect(mockStoreRef.current.state).toMatchObject({
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
  expect(store.getRouteInfo().pathname).toBe('/home');
});

test('throws when linking does not produce an initial state', () => {
  mockStoreRef.current.routeNode = null;

  expect(() =>
    render(
      <NavigationContainer linking={{ prefixes: [], getInitialURL: () => null }}>
        {null}
      </NavigationContainer>
    )
  ).toThrow(
    'Linking did not produce an initial navigation state. Expo Router always seeds a complete initial state before rendering the navigation container, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
  );
});

test('throws if multiple instances of useLinking are used', () => {
  const ref = createNavigationContainerRef<ParamListBase>();

  const options = { prefixes: [] };

  function Sample() {
    useLinking(ref, options, () => {});
    useLinking(ref, options, () => {});
    return null;
  }

  errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  let element: RenderAPI | undefined;

  element = render(<Sample />);

  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0]![0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  element?.unmount();

  function A() {
    useLinking(ref, options, () => {});
    return null;
  }

  function B() {
    useLinking(ref, options, () => {});
    return null;
  }

  element = render(
    <>
      <A />
      <B />
    </>
  );

  expect(errorSpy).toHaveBeenCalledTimes(2);
  expect(errorSpy.mock.calls[1]![0]).toMatch(
    'Looks like you have configured linking in multiple places.'
  );

  element?.unmount();

  function Sample2() {
    useLinking(ref, options, () => {});
    return null;
  }

  const wrapper2 = <Sample2 />;

  render(wrapper2).unmount();

  element = render(wrapper2);

  expect(errorSpy).toHaveBeenCalledTimes(2);

  element?.unmount();
});
