import { CommonActions, type StackNavigationState } from '../../react-navigation/routers';
import { StackRouter } from '../stack-router';

test('same-route navigation preserves merge semantics without consuming another preload', () => {
  const router = StackRouter({});
  const state: StackNavigationState<{ '[id]': { id: string; filter?: string } }> = {
    stale: false,
    routeKeySeq: 2,
    type: 'stack',
    key: 'navigator:root',
    index: 0,
    routeNames: ['[id]'],
    routes: [
      { key: '[id]:0', name: '[id]', params: { id: 'one', filter: 'recent' } },
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
  expect(result.state.routes).toContain(state.routes[1]);
});
