/** @jest-environment jsdom */
import { act, waitFor } from '@testing-library/react-native';

import { expectCompleteStateToMatch } from '../../__tests__/assertCompleteState';
import { node } from '../../global-state/__tests__/__fixtures__/routeNode';
import { completeParsedState } from '../../global-state/createSeededNavigationState';
import { getRouteInfoFromState } from '../../global-state/getRouteInfoFromState';
import { RouterRegistryProvider } from '../../global-state/routerRegistry';
import { routingQueue } from '../../global-state/routingQueue';
import { storeRef as mockStoreRef } from '../../global-state/store';
import { getRootStackRouteNames } from '../../global-state/utils';
import { getStateFromPath } from '../../link/linking';
import { Screen } from '../../react-navigation/core/Screen';
import { createNavigationContainerRef } from '../../react-navigation/core/createNavigationContainerRef';
import { useNavigationBuilder } from '../../react-navigation/core/useNavigationBuilder';
import { CommonActions, StackRouter, type NavigationState } from '../../react-navigation/routers';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import { getMockConfig } from '../../testing-library/mock-config';
import { NavigationContainer } from '../NavigationContainer';
import { createMemoryHistory } from '../createMemoryHistory';
import { useLinking } from '../useLinking';
import { render } from './__fixtures__/store';

jest.mock('../createMemoryHistory');
let mockNavigationRef: ReturnType<typeof createNavigationContainerRef>;
const mockRouteNode = node('root');
jest.mock('../../global-state/utils', () => ({
  ...jest.requireActual<typeof import('../../global-state/utils')>('../../global-state/utils'),
  getRootStackRouteNames: jest.fn(() => ['home']),
}));

const history = {
  index: 0,
  get: jest.fn(),
  backIndex: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  listen: jest.fn(() => () => {}),
};
const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');

function EmptyScreen() {
  return null;
}

beforeEach(() => {
  mockStoreRef.current.state = undefined;
  mockStoreRef.current.routeNode = null;
  routingQueue.queue = [];
  jest.mocked(getRootStackRouteNames).mockReturnValue(['home']);
  jest.mocked(createMemoryHistory).mockReturnValue(history);
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { hash: '' },
  });
});

function renderHistoryListener({
  initialIndex,
  getStateFromPath,
}: {
  initialIndex: number;
  getStateFromPath: jest.Mock;
}) {
  let historyListener: (() => void) | undefined;
  let historyIndex = initialIndex;
  jest.mocked(createMemoryHistory).mockReturnValueOnce({
    ...history,
    get index() {
      return historyIndex;
    },
    listen: (listener: () => void) => {
      historyListener = listener;
      return () => {};
    },
  });
  const navigation = {
    addListener: jest.fn(() => () => {}),
    getRootState: jest.fn(() => ({ key: 'root' })),
  };
  // The hook only reads these two methods from the navigation ref in these tests.
  const ref = { current: navigation } as unknown as Parameters<typeof useLinking>[0];

  function Sample() {
    useLinking(ref, { prefixes: [], getStateFromPath }, jest.fn());
    return null;
  }

  render(<Sample />);

  return {
    emitPopState(path: string, index: number) {
      historyIndex = index;
      Object.assign(globalThis.location, { pathname: path, search: '', hash: '' });
      act(() => historyListener?.());
    },
  };
}

test('queues forward history navigation', () => {
  mockStoreRef.current.routeNode = mockRouteNode;
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));
  const { emitPopState } = renderHistoryListener({ initialIndex: 3, getStateFromPath });

  history.get.mockReturnValueOnce(undefined);
  emitPopState('/forward', 4);

  expect(getStateFromPath).toHaveBeenCalledWith('/forward', undefined, []);
  expect(routingQueue.queue).toEqual([
    {
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/forward', options: { event: 'NAVIGATE' } },
      metadata: { history: { path: '/forward' } },
      onDispatch: expect.any(Function),
    },
  ]);
});

test('restores saved history state without parsing its path', () => {
  const savedState = {
    stale: false,
    routeKeySeq: 0,
    type: 'stack' as const,
    key: 'saved-stack',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'saved-home', name: 'home' }],
  };
  const getStateFromPath = jest.fn();
  const { emitPopState } = renderHistoryListener({ initialIndex: 4, getStateFromPath });

  history.get.mockReturnValueOnce({ path: '/saved', state: savedState });
  emitPopState('/saved', 3);

  expect(getStateFromPath).not.toHaveBeenCalled();
  expect(routingQueue.queue).toEqual([
    {
      type: 'ACTION',
      payload: {
        action: { type: 'RESET', payload: savedState, target: 'saved-stack' },
      },
      metadata: { history: { path: '/saved' } },
      onDispatch: expect.any(Function),
    },
  ]);
});

test('restores state parsed from a history path', () => {
  mockStoreRef.current.routeNode = mockRouteNode;
  const parsedState = { routes: [{ name: 'home' }] };
  const getStateFromPath = jest.fn(() => parsedState);
  const { emitPopState } = renderHistoryListener({ initialIndex: 3, getStateFromPath });

  history.get.mockReturnValueOnce({ path: '/other' });
  emitPopState('/parsed', 2);

  expect(getStateFromPath).toHaveBeenCalledWith('/parsed', undefined, []);
  const parsedIntent = routingQueue.queue[0];
  expect(parsedIntent).toMatchObject({
    type: 'ACTION',
    payload: { action: { type: 'RESET', target: expect.any(String) } },
    metadata: { history: { path: '/parsed' } },
  });
  const parsedPayload =
    parsedIntent?.type === 'ACTION' ? parsedIntent.payload.action.payload : undefined;
  // `NavigationAction` exposes its payload only as `object`.
  expectCompleteStateToMatch(parsedPayload as NavigationState | undefined, {
    stale: false,
    routeKeySeq: 1,
    key: 'navigator:root',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'home:0', name: 'home' }],
  });
});

test('restores initial state when a history path cannot be parsed', () => {
  const initialState = { routes: [{ key: 'initial', name: 'home' }] };
  const getStateFromPath = jest.fn(() => undefined);
  const { emitPopState } = renderHistoryListener({ initialIndex: 2, getStateFromPath });

  history.get.mockReturnValueOnce(undefined).mockReturnValueOnce({ state: initialState });
  emitPopState('/invalid', 1);

  expect(getStateFromPath).toHaveBeenCalledWith('/invalid', undefined, []);
  expect(routingQueue.queue).toEqual([
    {
      type: 'ACTION',
      payload: { action: { type: 'RESET', payload: initialState, target: 'root' } },
      metadata: { history: { path: '/invalid' } },
      onDispatch: expect.any(Function),
    },
  ]);
});

test('keeps the current route group when parsing a popstate path', () => {
  let historyListener: (() => void) | undefined;
  let historyIndex = 1;
  jest.mocked(createMemoryHistory).mockReturnValueOnce({
    ...history,
    get index() {
      return historyIndex;
    },
    listen: (listener: () => void) => {
      historyListener = listener;
      return () => {};
    },
  });
  const config = getMockConfig(['(a)/shared', '(b)/shared', '(a)/index', '(b)/other']);
  const parsedSharedState = getStateFromPath('/shared', config, ['(b)', 'other']);
  jest
    .mocked(getRootStackRouteNames)
    .mockReturnValue(parsedSharedState?.routes.map((route) => route.name) ?? []);
  mockStoreRef.current.state = completeParsedState(
    getStateFromPath('/other', config, ['(b)', 'other']),
    ROOT_CHAIN
  );
  expect(getRouteInfoFromState(mockStoreRef.current.state).segments).toEqual(['(b)', 'other']);
  const navigation = {
    addListener: jest.fn(() => () => {}),
    getRootState: jest.fn(() => ({ key: 'root' })),
  };
  // The hook only reads these two methods from the navigation ref in this test.
  const ref = { current: navigation } as unknown as Parameters<typeof useLinking>[0];
  const parsePath = jest.fn(getStateFromPath);

  function Sample() {
    useLinking(ref, { prefixes: [], config, getStateFromPath: parsePath }, jest.fn());
    return null;
  }

  render(<Sample />);

  parsePath.mockClear();
  historyIndex = 0;
  history.get.mockReturnValueOnce(undefined);
  Object.assign(globalThis.location, { pathname: '/shared', search: '', hash: '' });
  act(() => historyListener?.());

  expect(parsePath).toHaveBeenCalledWith('/shared', config, ['(b)', 'other']);
  expect(routingQueue.queue).toEqual([
    {
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/shared', options: { event: 'NAVIGATE' } },
      metadata: { history: { path: '/shared' } },
      onDispatch: expect.any(Function),
    },
  ]);
  const parsedState = completeParsedState(parsePath.mock.results[0]?.value, ROOT_CHAIN);
  expect(getRouteInfoFromState(parsedState).segments).toEqual(['(b)', 'shared']);
});

test('parses the initial URL instead of returning the existing store state', async () => {
  mockStoreRef.current.routeNode = mockRouteNode;
  const existingState = {
    stale: false as const,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'home', name: 'home' }],
  };
  mockNavigationRef = createNavigationContainerRef();
  mockStoreRef.current.state = existingState;
  Object.assign(globalThis.location, { pathname: '/home', search: '', hash: '' });
  let getInitialState: ReturnType<typeof useLinking>['getInitialState'] | undefined;
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));

  function Sample() {
    getInitialState = useLinking(
      mockNavigationRef,
      { prefixes: [], getInitialURL: () => 'http://localhost/home', getStateFromPath },
      jest.fn()
    ).getInitialState;
    return null;
  }

  render(<Sample />);

  const state = await getInitialState?.();
  expect(getStateFromPath).toHaveBeenCalledWith('/home', undefined);
  expect(state).not.toBe(existingState);
  expect(state).toMatchObject({
    stale: false,
    routeKeySeq: 1,
    routeNames: ['home'],
    routes: [{ name: 'home' }],
  });
});

test('getInitialState is computed once with first-render options', async () => {
  mockStoreRef.current.routeNode = mockRouteNode;
  mockNavigationRef = createNavigationContainerRef();
  Object.assign(globalThis.location, { pathname: '/home', search: '', hash: '' });
  const firstGetStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));
  const secondGetStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));
  let getInitialState: ReturnType<typeof useLinking>['getInitialState'] | undefined;

  function Sample({ getStateFromPath }: { getStateFromPath: typeof firstGetStateFromPath }) {
    getInitialState = useLinking(
      mockNavigationRef,
      { prefixes: [], getInitialURL: () => 'http://localhost/home', getStateFromPath },
      jest.fn()
    ).getInitialState;
    return null;
  }

  const element = render(<Sample getStateFromPath={firstGetStateFromPath} />);
  const firstGetInitialState = getInitialState;
  element.rerender(<Sample getStateFromPath={secondGetStateFromPath} />);
  await firstGetInitialState?.();

  expect(firstGetStateFromPath).toHaveBeenCalledWith('/home', undefined);
  expect(secondGetStateFromPath).not.toHaveBeenCalled();
});

afterEach(() => {
  if (locationDescriptor) {
    Object.defineProperty(globalThis, 'location', locationDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'location');
  }
  jest.restoreAllMocks();
});

test('does not add browser history when preloading a stack route', async () => {
  const Stack = (props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(StackRouter, props);

    return (
      <NavigationContent>
        {state.routes.map((route) => descriptors[route.key]!.render())}
      </NavigationContent>
    );
  };
  const ref = createNavigationContainerRef<any>();
  mockNavigationRef = ref;
  mockStoreRef.current.state = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home', 'details'],
    routes: [{ key: 'home', name: 'home' }],
  };
  const onStateChange = jest.fn();

  render(
    <RouterRegistryProvider>
      <NavigationContainer
        ref={ref}
        documentTitle={{ enabled: false }}
        onStateChange={onStateChange}
        linking={{
          prefixes: [],
          config: { screens: { home: 'home', details: 'details' } },
          getInitialURL: () => 'http://localhost/home',
          getStateFromPath: () => ({ routes: [{ name: 'home' }] }),
        }}>
        <Stack>
          <Screen name="home" component={EmptyScreen} />
          <Screen name="details" component={EmptyScreen} />
        </Stack>
      </NavigationContainer>
    </RouterRegistryProvider>
  );

  await waitFor(() => expect(ref.current).not.toBeNull());
  history.push.mockClear();
  history.replace.mockClear();

  act(() => ref.current?.dispatch(CommonActions.preload('details')));

  await waitFor(() => expect(history.replace).toHaveBeenCalled());
  expect(onStateChange).toHaveBeenCalled();
  expect(history.push).not.toHaveBeenCalled();
});
