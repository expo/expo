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

it('reads route info from the live store ref', () => {
  syncStoreNavigationState(state);
  storeRef.current.state = secondState;

  expect(store.getRouteInfo().pathname).toBe('/second');
});

it('memoizes route info for the current state reference', () => {
  syncStoreNavigationState(state);

  const first = store.getRouteInfo();
  expect(store.getRouteInfo()).toBe(first);

  syncStoreNavigationState({ ...state });
  expect(store.getRouteInfo()).not.toBe(first);
});

it('logs an error for stale focused state', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  // `ReactNavigationState` permits partial input, so this creates invalid runtime state deliberately.
  const staleState = {
    ...state,
    routes: [
      {
        ...state.routes[0]!,
        state: { ...state.routes[0]!.state!, stale: true },
      },
    ],
  } as ReactNavigationState;

  syncStoreNavigationState(staleState);

  expect(error).toHaveBeenCalledWith('Detected stale state. This is likely a bug in Expo Router.');
  process.env.NODE_ENV = nodeEnv;
  error.mockRestore();
});
