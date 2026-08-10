import { act, render } from '@testing-library/react-native';

import { routingQueue } from '../../global-state/routingQueue';
import type {
  NavigationContainerRef,
  NavigationState,
  ParamListBase,
} from '../../react-navigation/native';
import { useLinking } from '../useLinking';

let historyIndex = 0;
let historyListener: (() => void) | undefined;
const cachedState: NavigationState = {
  key: 'cached',
  index: 0,
  routeNames: ['home'],
  routes: [{ key: 'home', name: 'home' }],
  type: 'stack',
  stale: false,
};
const mockHistory = {
  get index() {
    return historyIndex;
  },
  get: jest.fn(),
  backIndex: jest.fn(),
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  listen: jest.fn((listener: () => void) => {
    historyListener = listener;
    return jest.fn();
  }),
};

jest.mock('../createMemoryHistory', () => ({
  createMemoryHistory: () => mockHistory,
}));
jest.mock('../../global-state/storeContext', () => ({
  ...jest.requireActual<typeof import('../../global-state/storeContext')>(
    '../../global-state/storeContext'
  ),
  useExpoRouterStore: () => ({ state: undefined }),
}));
jest.mock('../../global-state/utils', () => ({
  ...jest.requireActual<typeof import('../../global-state/utils')>('../../global-state/utils'),
  getRootStackRouteNames: () => ['home'],
}));

beforeEach(() => {
  historyIndex = 0;
  historyListener = undefined;
  jest.clearAllMocks();
  routingQueue.queue = [];
  if (typeof window !== 'undefined') {
    window.history.replaceState({}, '', '/initial');
  }
});

const webIt = typeof window !== 'undefined' ? it : it.skip;

webIt('queues forward links but resets cached and back history', () => {
  const resetRoot = jest.fn();
  const navigation = {
    addListener: jest.fn(() => jest.fn()),
    getRootState: jest.fn(),
    resetRoot,
  };
  // The hook only uses the navigation methods above in this history test.
  const ref = { current: navigation as unknown as NavigationContainerRef<ParamListBase> };
  const getStateFromPath = jest.fn(() => ({ routes: [{ name: 'home' }] }));

  function TestComponent() {
    useLinking(ref, { prefixes: [], getStateFromPath }, jest.fn());
    return null;
  }

  render(<TestComponent />);

  historyIndex = 1;
  mockHistory.get.mockReturnValueOnce(undefined);
  window.history.replaceState({}, '', '/forward');
  act(() => historyListener?.());

  expect(routingQueue.queue).toContainEqual({
    type: 'ROUTER_LINK',
    payload: {
      href: '/forward',
      options: { event: 'NAVIGATE' },
      onDispatch: expect.any(Function),
    },
  });
  expect(resetRoot).not.toHaveBeenCalled();

  historyIndex = 0;
  mockHistory.get.mockReturnValueOnce({ path: '/cached', state: cachedState });
  window.history.replaceState({}, '', '/cached');
  act(() => historyListener?.());

  expect(resetRoot).toHaveBeenLastCalledWith(cachedState);

  historyIndex = 1;
  mockHistory.get.mockReturnValueOnce(undefined);
  window.history.replaceState({}, '', '/forward-again');
  act(() => historyListener?.());

  expect(routingQueue.queue).toHaveLength(2);

  historyIndex = 0;
  mockHistory.get.mockReturnValueOnce(undefined);
  window.history.replaceState({}, '', '/back');
  act(() => historyListener?.());

  expect(resetRoot).toHaveBeenLastCalledWith(
    expect.objectContaining({ routes: [{ name: 'home' }] })
  );
  expect(routingQueue.queue).toHaveLength(2);
});
