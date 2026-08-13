import type { RefObject } from 'react';

import type { NavigationContainerRef, ParamListBase } from '../../react-navigation/native';
import { getNavigateAction, type NavigationActionContext } from '../getNavigationAction';
import { defaultRouteInfo } from '../getRouteInfoFromState';
import { routingQueue } from '../routingQueue';

const navigationActionContext = (navigationRef: NavigationContainerRef<ParamListBase>) => ({
  // The queue uses a plain navigation ref while production passes the ref object from context.
  navigationRef: {
    ...navigationRef,
    current: navigationRef,
  } as NavigationActionContext['navigationRef'],
  linking: undefined,
  redirects: [],
});

jest.mock('../getNavigationAction', () => ({
  getNavigateAction: jest.fn(),
}));

const mockGetNavigateAction = getNavigateAction as jest.MockedFunction<typeof getNavigateAction>;

function makeRef(
  overrides: Partial<NavigationContainerRef<ParamListBase>> = {}
): RefObject<NavigationContainerRef<ParamListBase>> {
  return {
    current: {
      dispatch: jest.fn(),
      navigate: jest.fn(),
      reset: jest.fn(),
      goBack: jest.fn(),
      isFocused: jest.fn(),
      canGoBack: jest.fn(),
      getState: jest.fn(),
      getRootState: jest.fn(),
      getParent: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      isReady: jest.fn(() => true),
      setParams: jest.fn(),
      getCurrentRoute: jest.fn(),
      getCurrentOptions: jest.fn(),
      getId: jest.fn(),
      resetRoot: jest.fn(),
      ...overrides,
    } as unknown as NavigationContainerRef<ParamListBase>,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Drain any leftover queue state
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
});

describe('routingQueue', () => {
  it('add() pushes intent to queue and notifies subscribers', () => {
    const callback = jest.fn();
    routingQueue.subscribe(callback);

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    expect(routingQueue.queue).toHaveLength(1);
    expect(routingQueue.queue[0]).toEqual({
      type: 'ACTION',
      payload: { action: { type: 'GO_BACK' } },
    });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('subscribe() returns unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = routingQueue.subscribe(callback);

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    unsubscribe();

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    expect(callback).not.toHaveBeenCalled();
  });

  it('snapshot() returns the current queue array', () => {
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });

    const snapshot = routingQueue.snapshot();

    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]).toEqual({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    expect(snapshot[1]).toEqual({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });
  });

  it('run() drains the queue', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });

    routingQueue.run(ref, defaultRouteInfo, navigationActionContext(ref.current!));

    expect(routingQueue.queue).toHaveLength(0);
  });

  it.each([
    { type: 'GO_BACK' },
    { type: 'POP', payload: { count: 2 } },
    { type: 'POP_TO_TOP' },
    { type: 'CUSTOM_ACTION', payload: { value: 1 } },
  ])('run() dispatches ACTION intent payload %j unchanged', (action) => {
    const ref = makeRef();

    routingQueue.add({ type: 'ACTION', payload: { action } });

    routingQueue.run(ref, defaultRouteInfo, navigationActionContext(ref.current!));

    expect(ref.current!.dispatch).toHaveBeenCalledWith(action);
  });

  it('run() converts NAVIGATE_TO_HREF intents via getNavigateAction then dispatches', () => {
    const ref = makeRef();
    const routeInfo = {
      pathname: '/current',
      pathnameWithParams: '/current',
      segments: ['current'],
      params: {},
      searchParams: new URLSearchParams(),
      unstable_globalHref: '',
      isIndex: false,
    };
    const navigateAction = {
      type: 'NAVIGATE',
      payload: { name: 'home', params: {}, singular: false },
      target: '123',
    };
    mockGetNavigateAction.mockReturnValueOnce(navigateAction);

    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/home', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref, routeInfo, navigationActionContext(ref.current!));

    expect(mockGetNavigateAction).toHaveBeenCalledWith(
      '/home',
      { event: 'NAVIGATE' },
      'NAVIGATE',
      undefined,
      undefined,
      false,
      routeInfo,
      navigationActionContext(ref.current!)
    );
    expect(ref.current!.dispatch).toHaveBeenCalledWith(navigateAction);
  });

  it('run() dispatches mixed NAVIGATE_TO_HREF and ACTION intents in queue order', () => {
    const ref = makeRef();
    const navigateAction = {
      type: 'NAVIGATE',
      payload: { name: 'a', params: {}, singular: false },
      target: 'root',
    };
    mockGetNavigateAction.mockReturnValueOnce(navigateAction);

    routingQueue.add({ type: 'NAVIGATE_TO_HREF', payload: { href: '/a', options: {} } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    routingQueue.run(ref);

    const dispatch = ref.current!.dispatch as jest.Mock;
    expect(dispatch.mock.calls).toEqual([[navigateAction], [{ type: 'GO_BACK' }]]);
  });

  it('run() does not dispatch when getNavigateAction returns undefined', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockReturnValueOnce(undefined);

    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/redirect', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref, defaultRouteInfo, navigationActionContext(ref.current!));

    expect(ref.current!.dispatch).not.toHaveBeenCalled();
  });

  it('run() does nothing when ref.current is null', () => {
    const ref = { current: null };

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    routingQueue.run(ref as any, defaultRouteInfo, navigationActionContext(ref.current!));

    // Queue should still be drained (reset identity happens before dispatch loop)
    expect(routingQueue.queue).toHaveLength(0);
  });

  it('run() resets queue identity so new actions during run go to a fresh array', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    const oldQueue = routingQueue.queue;

    routingQueue.run(ref, defaultRouteInfo, navigationActionContext(ref.current!));

    // The queue should be a new array reference
    expect(routingQueue.queue).not.toBe(oldQueue);
    expect(routingQueue.queue).toHaveLength(0);
  });

  it('multiple subscribers all get notified on add()', () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();
    const callback3 = jest.fn();

    routingQueue.subscribe(callback1);
    routingQueue.subscribe(callback2);
    routingQueue.subscribe(callback3);

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });
});
