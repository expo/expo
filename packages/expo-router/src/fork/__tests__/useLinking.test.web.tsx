/** @jest-environment jsdom */
import { node } from '../../global-state/__tests__/__fixtures__/routeNode';
import { createNavigationContainerRef } from '../../react-navigation/core/createNavigationContainerRef';
import { useLinking } from '../useLinking';
import { render, setNavigationState, setRouteNode } from './__fixtures__/store';

jest.mock('../../global-state/utils', () => ({
  ...jest.requireActual<typeof import('../../global-state/utils')>('../../global-state/utils'),
  getRootStackRouteNames: jest.fn(() => ['home']),
}));

const mockRouteNode = node('root');
const locationDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'location');

beforeEach(() => {
  setNavigationState(undefined);
  setRouteNode(mockRouteNode);
  Object.defineProperty(globalThis, 'location', {
    configurable: true,
    value: { pathname: '/home', search: '', hash: '' },
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

test('parses the initial URL instead of returning existing navigation state', async () => {
  const existingState = {
    stale: false as const,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['home'],
    routes: [{ key: 'home', name: 'home' }],
  };
  const ref = createNavigationContainerRef();
  setNavigationState(existingState);
  let getInitialState: ReturnType<typeof useLinking>['getInitialState'] | undefined;
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));

  function Sample() {
    getInitialState = useLinking(ref, {
      prefixes: [],
      getInitialURL: () => 'http://localhost/home',
      getStateFromPath,
    }).getInitialState;
    return null;
  }

  await render(<Sample />);

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
  const ref = createNavigationContainerRef();
  const firstGetStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));
  const secondGetStateFromPath = jest.fn(() => ({
    routes: [{ name: 'home' }],
  }));
  let getInitialState: ReturnType<typeof useLinking>['getInitialState'] | undefined;

  function Sample({ getStateFromPath }: { getStateFromPath: typeof firstGetStateFromPath }) {
    getInitialState = useLinking(ref, {
      prefixes: [],
      getInitialURL: () => 'http://localhost/home',
      getStateFromPath,
    }).getInitialState;
    return null;
  }

  const element = await render(<Sample getStateFromPath={firstGetStateFromPath} />);
  const firstGetInitialState = getInitialState;
  await element.rerender(<Sample getStateFromPath={secondGetStateFromPath} />);
  await firstGetInitialState?.();

  expect(firstGetStateFromPath).toHaveBeenCalledWith('/home', undefined);
  expect(secondGetStateFromPath).not.toHaveBeenCalled();
});
