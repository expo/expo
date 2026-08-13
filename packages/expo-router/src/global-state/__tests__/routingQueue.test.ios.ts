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

    routingQueue.run(ref);

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

    routingQueue.run(ref);

    expect(ref.current!.dispatch).toHaveBeenCalledWith(action);
  });

  it('run() converts NAVIGATE_TO_HREF intents via getNavigateAction then dispatches', () => {
    const ref = makeRef();
    const navigateAction = {
      type: 'NAVIGATE',
      payload: { name: 'home', params: {}, singular: false },
      target: '123',
    };
    mockGetNavigateAction.mockReturnValueOnce({
      status: 'action',
      action: navigateAction,
    });
    const registry = new Map();

    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/home', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref, registry);

    expect(mockGetNavigateAction).toHaveBeenCalledWith(
      '/home',
      { event: 'NAVIGATE' },
      registry,
      'NAVIGATE',
      undefined,
      undefined,
      false
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
    mockGetNavigateAction.mockReturnValueOnce({ status: 'action', action: navigateAction });

    routingQueue.add({ type: 'NAVIGATE_TO_HREF', payload: { href: '/a', options: {} } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    routingQueue.run(ref);

    const dispatch = ref.current!.dispatch as jest.Mock;
    expect(dispatch.mock.calls).toEqual([[navigateAction], [{ type: 'GO_BACK' }]]);
  });

  it('run() reports the queued action when handling fails', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockImplementationOnce(() => {
      throw new Error('malformed');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: {
        href: '/home',
        originalHref: 'example://home',
        options: { event: 'NAVIGATE' },
      },
    });

    routingQueue.run(ref);

    expect(warn).toHaveBeenCalledWith(
      'An error occurred when trying to handle navigation action ' +
        '{"type":"NAVIGATE_TO_HREF","payload":{"href":"/home","originalHref":"example://home","options":{"event":"NAVIGATE"}}}: malformed'
    );
    warn.mockRestore();
  });

  it('run() invokes onDispatch immediately before dispatching', () => {
    const calls: string[] = [];
    const ref = makeRef({ dispatch: jest.fn(() => calls.push('dispatch')) });
    const action = { type: 'RESET', payload: undefined };

    routingQueue.add({
      type: 'ACTION',
      payload: { action },
      onDispatch: () => calls.push('onDispatch'),
    });

    routingQueue.run(ref);

    expect(calls).toEqual(['onDispatch', 'dispatch']);
  });

  it('run() warns when a path is invalid', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockReturnValueOnce({
      status: 'invalid',
      href: '/invalid',
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/invalid', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/invalid'));
    warn.mockRestore();
  });

  it('run() warns when ref.current is null', () => {
    const ref = { current: null };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    routingQueue.run(ref as any);

    // Queue should still be drained (reset identity happens before dispatch loop)
    expect(routingQueue.queue).toHaveLength(0);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not mounted'));
    warn.mockRestore();
  });

  it('run() warns when two actions target the same navigator with sub-trees', () => {
    const ref = makeRef();
    const action = {
      type: 'NAVIGATE',
      target: 'root',
      payload: { name: 'home', state: { routes: [{ name: 'child' }] } },
    };
    mockGetNavigateAction
      .mockReturnValueOnce({ status: 'action', action })
      .mockReturnValueOnce({ status: 'action', action });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/one', options: {} },
    });
    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/two', options: {} },
    });

    routingQueue.run(ref);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('same navigator'));
    warn.mockRestore();
  });

  it('run() continues after an item throws during conversion', () => {
    const ref = makeRef();
    const nextAction = { type: 'NAVIGATE', payload: { name: 'next' } };
    mockGetNavigateAction
      .mockImplementationOnce(() => {
        throw new Error('malformed');
      })
      .mockReturnValueOnce({ status: 'action', action: nextAction });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/bad', options: {} },
    });
    routingQueue.add({
      type: 'NAVIGATE_TO_HREF',
      payload: { href: '/next', options: {} },
    });

    routingQueue.run(ref);

    expect(ref.current!.dispatch).toHaveBeenCalledWith(nextAction);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('malformed'));
    warn.mockRestore();
  });

  it('run() continues after an item throws during dispatch', () => {
    const dispatch = jest.fn().mockImplementationOnce(() => {
      throw new Error('dispatch failed');
    });
    const ref = makeRef({ dispatch });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });
    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'POP_TO_TOP' } } });

    routingQueue.run(ref);

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dispatch failed'));
    warn.mockRestore();
  });

  it('run() resets queue identity so new actions during run go to a fresh array', () => {
    const ref = makeRef();

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

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

    routingQueue.add({ type: 'ACTION', payload: { action: { type: 'GO_BACK' } } });

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });
});
