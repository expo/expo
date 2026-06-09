import { renderHook, act } from '@testing-library/react-native';
import { StrictMode, type RefObject } from 'react';

import { routingQueue } from '../global-state/routing';
import { useImperativeApiEmitter } from '../imperative-api';
import type { NavigationContainerRef, ParamListBase } from '../react-navigation/native';

// A raw (non-ROUTER_LINK) action is dispatched straight to the ref by `routingQueue.run`, so we can
// assert the drain path without standing up the linking config.
const rawAction = (name: string) =>
  ({ type: 'NAVIGATE', payload: { name } }) as unknown as Parameters<typeof routingQueue.add>[0];

function mockRef() {
  const dispatch = jest.fn();
  const ref = {
    current: { dispatch },
  } as unknown as RefObject<NavigationContainerRef<ParamListBase> | null>;
  return { ref, dispatch };
}

beforeEach(() => {
  routingQueue.queue = [];
  routingQueue.subscribers.clear();
});

describe('useImperativeApiEmitter', () => {
  it('drains actions enqueued before mount on the first commit', () => {
    const { ref, dispatch } = mockRef();
    // Simulate a module-level `router.push` firing before the emitter mounts.
    routingQueue.add(rawAction('early'));

    renderHook(() => useImperativeApiEmitter(ref));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(rawAction('early'));
  });

  it('drains actions enqueued after mount', () => {
    const { ref, dispatch } = mockRef();
    renderHook(() => useImperativeApiEmitter(ref));
    expect(dispatch).toHaveBeenCalledTimes(0);

    act(() => {
      routingQueue.add(rawAction('later'));
    });

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(rawAction('later'));
  });

  it('does not double-dispatch a pre-mount action under StrictMode', () => {
    const { ref, dispatch } = mockRef();
    routingQueue.add(rawAction('strict'));

    renderHook(() => useImperativeApiEmitter(ref), { wrapper: StrictMode });

    // `routingQueue.run` resets the queue identity, so a StrictMode double-mount drains once.
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('coalesces multiple synchronous adds into the same drain', () => {
    const { ref, dispatch } = mockRef();
    renderHook(() => useImperativeApiEmitter(ref));

    act(() => {
      routingQueue.add(rawAction('a'));
      routingQueue.add(rawAction('b'));
    });

    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenNthCalledWith(1, rawAction('a'));
    expect(dispatch).toHaveBeenNthCalledWith(2, rawAction('b'));
  });

  it('registers a single live subscriber', () => {
    const { ref } = mockRef();
    renderHook(() => useImperativeApiEmitter(ref));
    expect(routingQueue.subscribers.size).toBe(1);
  });

  it('drains an action enqueued re-entrantly during a dispatch', () => {
    // An action handler that itself calls router.push enqueues mid-drain. `routingQueue.run` swaps
    // in a fresh queue before dispatching, so the re-entrant add lands in the new queue and its
    // bumpTick schedules a second drain — nothing is stranded. This property is load-bearing for C2.
    const dispatch = jest.fn();
    let reentered = false;
    dispatch.mockImplementation(() => {
      if (!reentered) {
        reentered = true;
        routingQueue.add(rawAction('reentrant'));
      }
    });
    const ref = {
      current: { dispatch },
    } as unknown as RefObject<NavigationContainerRef<ParamListBase> | null>;

    renderHook(() => useImperativeApiEmitter(ref));
    act(() => {
      routingQueue.add(rawAction('first'));
    });

    expect(dispatch).toHaveBeenNthCalledWith(1, rawAction('first'));
    expect(dispatch).toHaveBeenNthCalledWith(2, rawAction('reentrant'));
    expect(routingQueue.queue).toHaveLength(0);
  });

  it('empties the queue even when ref.current is null (pre-existing drop, not retry)', () => {
    const ref = { current: null } as RefObject<NavigationContainerRef<ParamListBase> | null>;
    routingQueue.add(rawAction('lost'));

    renderHook(() => useImperativeApiEmitter(ref));

    // The mount drain runs and clears the queue; with no container the action is dropped, not held.
    expect(routingQueue.queue).toHaveLength(0);
  });
});
