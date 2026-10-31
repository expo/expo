import { act, render } from '@testing-library/react-native';
import * as React from 'react';

import type { NavigationState } from '../../react-navigation/routers';
import { createNavigationActionResultRegistry } from '../navigationActionResult';
import { RemovalPreventionProvider } from '../removalPrevention';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';
import { useNavigationTreeReportEvents } from '../useNavigationTreeReportEvents';
import { entry } from './__fixtures__/routerEntry';

const initialState: NavigationState = {
  stale: false,
  key: 'root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['home', 'search'],
  routes: [
    { key: 'home', name: 'home' },
    { key: 'search', name: 'search' },
  ],
};
const browserHistory = { apply() {}, listen: () => () => {} };

test.each([false, true])(
  'guarded navigation waits for older suspended navigation (cleanup=%s)',
  async (cleanup) => {
    const results = createNavigationActionResultRegistry();
    const callback = jest.fn();
    let blocked = true;
    let resolve!: () => void;
    const suspended = new Promise<void>((done) => {
      resolve = done;
    });
    let processIntent!: ReturnType<typeof useNavigationTreeReducer>['processIntent'];
    let committed = initialState;
    const registry = new Map([
      [
        'root',
        entry((state, action) => ({
          state: action.type === 'LOW' ? { ...state, lowPriority: true } : { ...state, index: 1 },
          affectedRouteKey: state.routes[1]!.key,
        })),
      ],
    ]);
    function Consumer() {
      const cancelledTransactions = React.useSyncExternalStore(
        results.subscribe,
        results.getSnapshot,
        results.getSnapshot
      );
      const reducer = useNavigationTreeReducer({ initialState, registry, cancelledTransactions });
      processIntent = reducer.processIntent;
      useNavigationTreeReportEvents(
        reducer.report,
        reducer.consumeReportEvents,
        browserHistory,
        results.settle
      );
      React.useLayoutEffect(() => {
        committed = reducer.state;
      }, [reducer.state]);
      if ('lowPriority' in reducer.state && blocked) throw suspended;
      return null;
    }
    await render(
      <RemovalPreventionProvider>
        <React.Suspense fallback={null}>
          <Consumer />
        </React.Suspense>
      </RemovalPreventionProvider>
    );
    await act(() =>
      React.startTransition(() =>
        processIntent({ type: 'ACTION', actionId: 1, payload: { action: { type: 'LOW' } } })
      )
    );
    expect(committed.index).toBe(0);
    const subscription = results.register(callback);
    await act(() =>
      processIntent({
        type: 'ACTION',
        actionId: 2,
        payload: {
          action: { type: 'NEXT' },
          originKey: 'root',
          transaction: { id: subscription.id, token: subscription.token, expectedState: committed },
        },
      })
    );
    expect(committed.index).toBe(0);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'cancelled' }));
    if (cleanup) await act(() => subscription.remove());
    await act(async () => {
      blocked = false;
      resolve();
      await suspended;
    });
    expect(committed.index).toBe(0);
    expect(callback).toHaveBeenCalledTimes(1);
    const nextCallback = jest.fn();
    const next = results.register(nextCallback);
    await act(() =>
      processIntent({
        type: 'ACTION',
        actionId: 3,
        payload: {
          action: { type: 'NEXT' },
          originKey: 'root',
          transaction: { id: next.id, token: next.token, expectedState: committed },
        },
      })
    );
    expect(committed.index).toBe(1);
    expect(nextCallback).toHaveBeenCalledWith(expect.objectContaining({ status: 'handled' }));
    await act(() => next.remove());
    expect(committed.index).toBe(1);
  }
);
