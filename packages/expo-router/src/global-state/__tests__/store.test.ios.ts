import { INTERNAL_SLOT_NAME } from '../../constants';
import { store, storeRef, syncStoreNavigationState } from '../store';
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

const secondState: ReactNavigationState = {
  ...state,
  key: 'second-root',
  routes: [
    {
      key: 'second-slot',
      name: INTERNAL_SLOT_NAME,
      state: {
        stale: false,
        routeKeySeq: 0,
        key: 'second-layout',
        index: 0,
        routeNames: ['second'],
        routes: [{ key: 'second', name: 'second', path: '/second' }],
      },
    },
  ],
};

afterEach(() => {
  storeRef.current.state = undefined;
});

it('derives route info from the current state', () => {
  syncStoreNavigationState(state);
  storeRef.current.state = secondState;

  expect(store.getRouteInfo().pathname).toBe('/second');
});
