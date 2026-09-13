import { CommonActions, type StackNavigationState } from '../../react-navigation/routers';
import { StackRouter } from '../stack-router';

test('same-route navigation preserves merge semantics without consuming another preload', () => {
  const router = StackRouter({});
  const childState = {
    stale: false as const,
    routeKeySeq: 0,
    type: 'stack' as const,
    key: 'navigator:0',
    index: 0,
    routeNames: ['index'],
    routes: [{ key: 'index:0', name: 'index' }],
  };
  const state: StackNavigationState<{ '[id]': { id: string; filter?: string } }> = {
    stale: false,
    routeKeySeq: 2,
    type: 'stack',
    key: 'navigator:root',
    index: 0,
    routeNames: ['[id]'],
    routes: [
      {
        key: '[id]:0',
        name: '[id]',
        params: { id: 'one', filter: 'recent' },
        state: childState,
      },
      { key: '[id]:1', name: '[id]', params: { id: 'preloaded' } },
    ],
  };

  const result = router.getStateForAction(
    state,
    CommonActions.navigate('[id]', { id: 'two' }, { merge: true }),
    { routeNames: ['[id]'], routeGetIdList: {} }
  )!;

  expect(result.affectedRouteKey).toBe('[id]:2');
  expect(result.state.routes[result.state.index]!.params).toEqual({
    id: 'two',
    filter: 'recent',
  });
  expect(result.state.routes[0]!.state).toBe(childState);
  expect(result.state.routes[result.state.index]!.state).toBeUndefined();
  expect(result.state.routes).toContain(state.routes[1]);
});

test('same-route navigation attaches fresh trusted state', () => {
  const router = StackRouter({});
  const state: StackNavigationState<{ '[id]': { id: string } }> = {
    stale: false,
    routeKeySeq: 1,
    type: 'stack',
    key: 'navigator:root',
    index: 0,
    routeNames: ['[id]'],
    routes: [
      {
        key: '[id]:0',
        name: '[id]',
        params: { id: 'one' },
        state: { routes: [{ name: 'stale' }] },
      },
    ],
  };

  const result = router.getStateForAction(
    state,
    {
      type: 'NAVIGATE',
      payload: {
        name: '[id]',
        params: { id: 'two' },
        state: {
          routes: [{ name: 'fresh' }],
          __internal__routerActionState: true,
        },
      },
    },
    { routeNames: ['[id]'], routeGetIdList: {} }
  )!;

  expect(result.state.routes[0]!.state).toBe(state.routes[0]!.state);
  expect(result.state.routes[result.state.index]!.state).toEqual({
    routes: [{ name: 'fresh' }],
  });
});
