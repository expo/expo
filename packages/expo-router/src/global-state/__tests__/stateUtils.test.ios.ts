import type { NavigationState } from '../../react-navigation/native';
import { resetNavigatorState } from '../stateUtils';

describe('resetNavigatorState', () => {
  it('keeps only the focused route and fields shared by every navigator', () => {
    const nestedState: NavigationState = {
      stale: false,
      routeKeySeq: 1,
      key: 'nested',
      index: 0,
      routeNames: ['child'],
      routes: [{ key: 'child-key', name: 'child' }],
    };
    const state: NavigationState = {
      stale: false,
      routeKeySeq: 4,
      key: 'navigator',
      type: 'tab',
      index: 1,
      routeNames: ['first', 'second'],
      routes: [
        { key: 'first-key', name: 'first' },
        {
          key: 'second-key',
          name: 'second',
          params: { id: '123' },
          state: nestedState,
        },
      ],
      history: [{ type: 'route', key: 'second-key' }],
    };

    expect(resetNavigatorState(state, 'stack')).toEqual({
      stale: false,
      routeKeySeq: 4,
      key: 'navigator',
      type: 'stack',
      index: 0,
      routeNames: ['first', 'second'],
      routes: [state.routes[1]],
    });
  });

  it('keeps an empty navigator state complete', () => {
    const state: NavigationState = {
      stale: false,
      routeKeySeq: 0,
      key: 'navigator',
      type: 'tab',
      index: -1,
      routeNames: [],
      routes: [],
      history: [],
    };

    expect(resetNavigatorState(state, 'stack')).toEqual({
      stale: false,
      routeKeySeq: 0,
      key: 'navigator',
      type: 'stack',
      index: -1,
      routeNames: [],
      routes: [],
    });
  });
});
