import { act, renderHook } from '@testing-library/react-native';
import { useMemo } from 'react';

import { TabRouter, type NavigationState } from '../../react-navigation/routers';
import type { RouterRegistryEntry } from '../routerRegistry';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';

const A = ['bar', 'baz', 'qux'];
const B = ['baz', 'bar', 'qux'];
function entry(order: string[]): RouterRegistryEntry {
  const router = TabRouter({ backBehavior: 'order' });
  return {
    routerType: 'tab',
    declaredRouteNames: order,
    prepareHistory: (state) =>
      router.getStateForRouteConfigChange(state as never, {
        routeNames: state.routeNames,
        declaredRouteNames: order,
        repairHistory: true,
        orderOnly: true,
      }),
    reduce: (state, action) =>
      router.getStateForAction(state as never, action as never, {
        routeNames: order,
        routeGetIdList: {},
      }),
  } as RouterRegistryEntry;
}
function setup(order = A) {
  const initial: NavigationState = {
    key: 'root',
    type: 'tab',
    stale: false,
    routeKeySeq: 3,
    routeNames: A,
    index: 0,
    routes: A.map((name) => ({ name, key: name })),
    history: [{ type: 'route', key: 'bar' }],
  };
  const test = renderHook(
    ({ order }: { order: string[] }) => {
      const registry = useMemo(() => new Map([['root', entry(order)]]), [order]);
      return useNavigationTreeReducer({ initialState: initial, registry });
    },
    { initialProps: { order } }
  );
  const dispatch = (type: string, name?: string) =>
    act(() => test.result.current.handleAction({ type, ...(name ? { payload: { name } } : {}) }));
  const focus = () => test.result.current.state.routes[test.result.current.state.index]!.name;
  return { ...test, dispatch, focus };
}

it('preserves REPLACE truncation across an order change away and back', () => {
  const test = setup();
  test.dispatch('JUMP_TO', 'baz');
  test.dispatch('REPLACE', 'qux');
  const before = test.result.current.state;
  test.rerender({ order: B });
  test.rerender({ order: [...A] });
  expect(test.result.current.state).toBe(before);
  test.dispatch('GO_BACK');
  expect(test.focus()).toBe('bar');
  const last = test.result.current.state;
  test.dispatch('GO_BACK');
  expect(test.result.current.state).toBe(last);
});

it('prepares history computed under another order before Back', () => {
  const test = setup();
  test.dispatch('JUMP_TO', 'baz');
  test.dispatch('REPLACE', 'qux');
  test.rerender({ order: B });
  test.dispatch('JUMP_TO', 'qux');
  test.rerender({ order: A });
  test.dispatch('GO_BACK');
  expect(test.focus()).toBe('baz');
});

it('uses current order after parameter history copies and keeps metadata outside state', () => {
  const test = setup();
  test.dispatch('JUMP_TO', 'qux');
  test.rerender({ order: B });
  act(() =>
    test.result.current.handleAction({ type: 'SET_PARAMS', payload: { params: { value: 1 } } })
  );
  test.dispatch('GO_BACK');
  expect(test.focus()).toBe('bar');
  expect(Object.keys(test.result.current.state).sort()).toEqual([
    'history',
    'index',
    'key',
    'routeKeySeq',
    'routeNames',
    'routes',
    'stale',
    'type',
  ]);
});
