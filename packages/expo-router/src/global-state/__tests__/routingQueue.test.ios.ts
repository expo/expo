import type { RefObject } from 'react';

import type { NavigationContainerRef, ParamListBase } from '../../react-navigation/native';
import { getNavigateAction } from '../getNavigationAction';
import { routingQueue } from '../routingQueue';

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
  it('add() pushes action to queue and notifies subscribers', () => {
    const callback = jest.fn();
    routingQueue.subscribe(callback);

    routingQueue.add({ type: 'GO_BACK' });

    expect(routingQueue.queue).toHaveLength(1);
    expect(routingQueue.queue[0]).toEqual({ type: 'GO_BACK' });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('subscribe() returns unsubscribe function', () => {
    const callback = jest.fn();
    const unsubscribe = routingQueue.subscribe(callback);

    routingQueue.add({ type: 'GO_BACK' });
    expect(callback).toHaveBeenCalledTimes(1);
    callback.mockClear();

    unsubscribe();

    routingQueue.add({ type: 'GO_BACK' });
    expect(callback).not.toHaveBeenCalled();
  });

  it('snapshot() returns the current queue array', () => {
    routingQueue.add({ type: 'GO_BACK' });
    routingQueue.add({ type: 'POP_TO_TOP' });

    const snapshot = routingQueue.snapshot();

    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]).toEqual({ type: 'GO_BACK' });
    expect(snapshot[1]).toEqual({ type: 'POP_TO_TOP' });
  });

  it('run() drains the queue', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'GO_BACK' });
    routingQueue.add({ type: 'POP_TO_TOP' });

    routingQueue.run(ref);

    expect(routingQueue.queue).toHaveLength(0);
  });

  it('run() dispatches plain actions via ref.current.dispatch()', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'GO_BACK' });

    routingQueue.run(ref);

    expect(ref.current!.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
  });

  it('run() converts ROUTER_LINK actions via getNavigateAction then dispatches', () => {
    const ref = makeRef();
    const navigateAction = {
      type: 'NAVIGATE',
      payload: { name: 'home', params: {}, singular: false },
      target: '123',
    };
    mockGetNavigateAction.mockReturnValueOnce(navigateAction);

    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/home', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref);

    expect(mockGetNavigateAction).toHaveBeenCalledWith(
      '/home',
      { event: 'NAVIGATE' },
      'NAVIGATE',
      undefined,
      undefined,
      false
    );
    expect(ref.current!.dispatch).toHaveBeenCalledWith(navigateAction);
  });

  it('run() does not dispatch when getNavigateAction returns undefined', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockReturnValueOnce(undefined);

    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/redirect', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref);

    expect(ref.current!.dispatch).not.toHaveBeenCalled();
  });

  it('run() does nothing when ref.current is null', () => {
    const ref = { current: null };

    routingQueue.add({ type: 'GO_BACK' });

    routingQueue.run(ref as any);

    // Queue should still be drained (reset identity happens before dispatch loop)
    expect(routingQueue.queue).toHaveLength(0);
  });

  it('run() resets queue identity so new actions during run go to a fresh array', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'GO_BACK' });

    const oldQueue = routingQueue.queue;

    routingQueue.run(ref);

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

    routingQueue.add({ type: 'GO_BACK' });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });
});
