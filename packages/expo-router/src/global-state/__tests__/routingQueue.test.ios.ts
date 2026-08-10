import type { RefObject } from 'react';

import type { NavigationContainerRef, ParamListBase } from '../../react-navigation/native';
import { DEFER_NAVIGATION } from '../composeNavigationState';
import { getNavigateAction } from '../getNavigationAction';
import type { RouterRegistry } from '../routerRegistry';
import { routingQueue } from '../routingQueue';

jest.mock('../getNavigationAction', () => ({
  getNavigateAction: jest.fn(),
}));

const mockGetNavigateAction = jest.mocked(getNavigateAction);
const registry: RouterRegistry = new Map();

function makeRef(): RefObject<NavigationContainerRef<ParamListBase>> {
  return {
    current: {
      dispatch: jest.fn(),
      isReady: jest.fn(() => true),
    } as unknown as NavigationContainerRef<ParamListBase>,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  routingQueue.queue = [];
  routingQueue.version = 0;
  routingQueue.subscribers.clear();
});

describe('routingQueue', () => {
  it('unsubscribes snapshot listeners', () => {
    const callback = jest.fn();
    const unsubscribe = routingQueue.subscribe(callback);

    unsubscribe();
    routingQueue.add({ type: 'GO_BACK' });

    expect(callback).not.toHaveBeenCalled();
  });

  it('publishes a new snapshot when an action is added', () => {
    const callback = jest.fn();
    routingQueue.subscribe(callback);
    const previousSnapshot = routingQueue.snapshot();

    routingQueue.add({ type: 'GO_BACK' });

    expect(routingQueue.snapshot()).not.toBe(previousSnapshot);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('retains actions until the navigation ref is ready', () => {
    routingQueue.add({ type: 'GO_BACK' });

    routingQueue.run({ current: null }, registry);

    expect(routingQueue.queue).toEqual([{ type: 'GO_BACK' }]);
  });

  it('dispatches plain actions in FIFO order', () => {
    const ref = makeRef();
    routingQueue.add({ type: 'GO_BACK' });
    routingQueue.add({ type: 'POP_TO_TOP' });

    routingQueue.run(ref, registry);

    expect(ref.current!.dispatch).toHaveBeenNthCalledWith(1, { type: 'GO_BACK' });
    expect(ref.current!.dispatch).toHaveBeenNthCalledWith(2, { type: 'POP_TO_TOP' });
    expect(routingQueue.queue).toEqual([]);
  });

  it('leaves a deferred link at the head and blocks later actions', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockReturnValue(DEFER_NAVIGATION);
    const link = {
      type: 'ROUTER_LINK' as const,
      payload: { href: '/parent/child', options: { event: 'NAVIGATE' as const } },
    };
    routingQueue.add(link);
    routingQueue.add({ type: 'GO_BACK' });

    routingQueue.run(ref, registry);

    expect(routingQueue.queue).toEqual([link, { type: 'GO_BACK' }]);
    expect(ref.current!.dispatch).not.toHaveBeenCalled();
  });

  it('recomputes a deferred href with the latest registry', () => {
    const ref = makeRef();
    const nextRegistry: RouterRegistry = new Map([
      ['root', { routerType: 'stack', reduce: (state) => state }],
    ]);
    const action = { type: 'RESET', target: 'root', payload: {} };
    mockGetNavigateAction
      .mockReturnValueOnce(DEFER_NAVIGATION)
      .mockReturnValueOnce(action as ReturnType<typeof getNavigateAction>);
    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/parent/child', options: { event: 'NAVIGATE' } },
    });

    routingQueue.run(ref, registry);
    routingQueue.run(ref, nextRegistry);

    expect(mockGetNavigateAction).toHaveBeenCalledTimes(2);
    expect(mockGetNavigateAction.mock.calls[1]![6]).toBe(nextRegistry);
    expect(ref.current!.dispatch).toHaveBeenCalledWith(action);
  });

  it('stops after one composed RESET and schedules remaining work', () => {
    const ref = makeRef();
    const callback = jest.fn();
    routingQueue.subscribe(callback);
    mockGetNavigateAction.mockReturnValue({
      type: 'RESET',
      target: 'root',
      payload: {},
    } as ReturnType<typeof getNavigateAction>);
    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/first/deep', options: { event: 'NAVIGATE' } },
    });
    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/second/deep', options: { event: 'NAVIGATE' } },
    });
    callback.mockClear();

    routingQueue.run(ref, registry);

    expect(ref.current!.dispatch).toHaveBeenCalledTimes(1);
    expect(routingQueue.queue).toHaveLength(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('consumes a permanent no-op and continues', () => {
    const ref = makeRef();
    mockGetNavigateAction.mockReturnValue(undefined);
    routingQueue.add({
      type: 'ROUTER_LINK',
      payload: { href: '/redirect', options: { event: 'NAVIGATE' } },
    });
    routingQueue.add({ type: 'GO_BACK' });

    routingQueue.run(ref, registry);

    expect(ref.current!.dispatch).toHaveBeenCalledWith({ type: 'GO_BACK' });
    expect(routingQueue.queue).toEqual([]);
  });
});
