import { INTERNAL_SLOT_NAME } from '../../constants';
import { routeInfoSubscribers } from '../routeInfoCache';
import { store, storeRef, syncStoreState } from '../store';
import type { ReactNavigationState } from '../types';

const state: ReactNavigationState = {
  stale: false,
  routeKeySeq: 0,
  key: 'root',
  index: 0,
  routeNames: [INTERNAL_SLOT_NAME],
  routes: [
    {
      key: 'slot',
      name: INTERNAL_SLOT_NAME,
      state: {
        stale: false,
        routeKeySeq: 0,
        key: 'layout',
        index: 0,
        routeNames: ['index'],
        routes: [{ key: 'index', name: 'index', path: '/' }],
      },
    },
  ],
};

afterEach(() => {
  routeInfoSubscribers.clear();
  storeRef.current.state = undefined;
  storeRef.current.routeInfo = undefined;
});

it('synchronizes state and route info without notifying subscribers', () => {
  const subscriber = jest.fn();
  routeInfoSubscribers.add(subscriber);

  syncStoreState(state);

  expect(store.state).toBe(state);
  expect(store.getRouteInfo().pathname).toBe('/');
  expect(subscriber).not.toHaveBeenCalled();
});

it('notifies subscribers only from the layout state-change callback', () => {
  const subscriber = jest.fn();
  routeInfoSubscribers.add(subscriber);
  syncStoreState(state);

  store.onStateChange(state);

  expect(store.state).toBe(state);
  expect(subscriber).toHaveBeenCalledTimes(1);
});
