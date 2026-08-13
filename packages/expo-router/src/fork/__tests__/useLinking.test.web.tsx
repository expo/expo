import { act, render, waitFor } from '@testing-library/react-native';

import { RouterRegistryProvider } from '../../global-state/routerRegistry';
import { routingQueue } from '../../global-state/routingQueue';
import { Screen } from '../../react-navigation/core/Screen';
import { createNavigationContainerRef } from '../../react-navigation/core/createNavigationContainerRef';
import { useNavigationBuilder } from '../../react-navigation/core/useNavigationBuilder';
import { CommonActions, StackRouter } from '../../react-navigation/routers';
import { NavigationContainer } from '../NavigationContainer';
import { createMemoryHistory } from '../createMemoryHistory';
import { useLinking } from '../useLinking';

jest.mock('../createMemoryHistory');

let mockNavigationRef: ReturnType<typeof createNavigationContainerRef>;
jest.mock('../../global-state/storeContext', () => ({
  useExpoRouterStore: () => ({
    get state() {
      return mockNavigationRef?.current?.getRootState();
    },
  }),
}));
jest.mock('../../global-state/utils', () => ({
  ...jest.requireActual<typeof import('../../global-state/utils')>('../../global-state/utils'),
  getRootStackRouteNames: () => ['home'],
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
  routingQueue.queue = [];
  jest.mocked(createMemoryHistory).mockReturnValue(history);
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { hash: '' },
  });
});

const webTest = typeof window === 'undefined' ? test.skip : test;

webTest('queues forward history and restores saved, parsed, and initial state', () => {
  let historyListener: (() => void) | undefined;
  let historyIndex = 3;
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
  const savedState = {
    stale: false,
    type: 'stack',
    key: 'saved-stack',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'saved-home', name: 'home' }],
  };
  const parsedState = { routes: [{ name: 'home' }] };
  const navigation = {
    addListener: jest.fn(() => () => {}),
    getRootState: jest.fn(() => ({ key: 'root' })),
  };
  const ref = { current: navigation } as any;
  const getStateFromPath = jest.fn(() => parsedState);

  function Sample() {
    useLinking(ref, { prefixes: [], getStateFromPath }, jest.fn());
    return null;
  }

  render(<Sample />);

  historyIndex = 4;
  history.get.mockReturnValueOnce(undefined);
  Object.assign(globalThis.location, { pathname: '/forward', search: '', hash: '' });
  act(() => historyListener?.());
  expect(routingQueue.queue[0]).toMatchObject({
    type: 'NAVIGATE_TO_HREF',
    payload: { href: '/forward', options: { event: 'NAVIGATE' } },
    metadata: { history: { id: 0, path: '/forward' } },
  });

  historyIndex = 3;
  history.get.mockReturnValueOnce({ path: '/saved', state: savedState });
  Object.assign(globalThis.location, { pathname: '/saved', search: '', hash: '' });
  act(() => historyListener?.());
  expect(routingQueue.queue[1]).toMatchObject({
    type: 'ACTION',
    payload: { action: { type: 'RESET', payload: savedState, target: 'saved-stack' } },
    metadata: { history: { id: 1, path: '/saved' } },
  });

  historyIndex = 2;
  history.get.mockReturnValueOnce({ path: '/other' });
  Object.assign(globalThis.location, { pathname: '/parsed', search: '', hash: '' });
  act(() => historyListener?.());
  expect(routingQueue.queue[2]).toMatchObject({
    type: 'ACTION',
    payload: { action: { type: 'RESET', payload: parsedState, target: 'root' } },
    metadata: { history: { id: 2, path: '/parsed' } },
  });

  const initialState = { routes: [{ key: 'initial', name: 'home' }] };
  getStateFromPath.mockReturnValueOnce(undefined as never);
  historyIndex = 1;
  history.get.mockReturnValueOnce(undefined).mockReturnValueOnce({ state: initialState });
  Object.assign(globalThis.location, { pathname: '/invalid', search: '', hash: '' });
  act(() => historyListener?.());
  expect(routingQueue.queue[3]).toMatchObject({
    type: 'ACTION',
    payload: { action: { type: 'RESET', payload: initialState, target: 'root' } },
    metadata: { history: { id: 3, path: '/invalid' } },
  });
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
