import type { ParamListBase, Route, StackNavigationState } from '../../../native';
import { makeRestoreRouteAction } from '../makeRestoreRouteAction';

const active: Route<string> = { key: 'index', name: 'index' };
const closing: Route<string> = { key: 'second', name: 'second' };
const preloaded: Route<string> = { key: 'third', name: 'third' };

const state: StackNavigationState<ParamListBase> = {
  stale: false,
  type: 'stack',
  key: 'stack',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['index', 'second', 'third'],
  routes: [active, closing, preloaded],
};

it('restores a known route before preloaded routes', () => {
  const dispatch = jest.fn();

  expect(makeRestoreRouteAction(dispatch, state)(closing)).toBe(true);
  expect(dispatch).toHaveBeenCalledWith(
    expect.objectContaining({
      type: 'RESET',
      payload: expect.objectContaining({
        index: 1,
        routes: [active, closing, preloaded],
      }),
    })
  );
});

it('does not restore a route that is not in the navigator', () => {
  const dispatch = jest.fn();

  expect(makeRestoreRouteAction(dispatch, state)({ key: 'unknown', name: 'unknown' })).toBe(false);
  expect(dispatch).not.toHaveBeenCalled();
});
