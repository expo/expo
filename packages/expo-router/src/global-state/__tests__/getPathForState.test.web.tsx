import { findFocusedRoute } from '../../fork/findFocusedRoute';
import { getPathFromState, getStateFromPath } from '../../link/linking';
import type { NavigationState } from '../../react-navigation/routers';
import { ROOT_CHAIN } from '../../react-navigation/routers/stateKeys';
import { getMockConfig } from '../../testing-library/mock-config';
import { completeParsedState } from '../createSeededNavigationState';
import { getPathForState } from '../getPathForState';

const config = getMockConfig(['index', 'docs/[...rest]', 'user/[id]']);
const linking = { config, getStateFromPath, getPathFromState };

function stateFor(path: string): NavigationState {
  return completeParsedState(getStateFromPath(path, config), ROOT_CHAIN)!;
}

// Returns a copy whose focused route is changed in place; `findFocusedRoute` types the route as
// read-only, but the copy is ours to edit.
function withFocusedRoute(
  state: NavigationState,
  edit: (route: { params?: object; path?: string }) => void
): NavigationState {
  const copy: NavigationState = JSON.parse(JSON.stringify(state));
  edit(findFocusedRoute(copy) as { params?: object; path?: string });
  return copy;
}

test('keeps the original URL of a wildcard route while it still matches', () => {
  const state = stateFor('/docs/a/b/?x=1');

  expect(getPathForState(state, linking)).toBe('/docs/a/b/?x=1');
  expect(getPathFromState(state, config)).not.toBe('/docs/a/b/?x=1');
});

test('serializes the state when the focused params no longer match the original URL', () => {
  const changed = withFocusedRoute(stateFor('/docs/a/b/?x=1'), (route) => {
    route.params = { ...route.params, x: '2' };
  });

  expect(getPathForState(changed, linking)).toBe(getPathFromState(changed, config));
  expect(getPathForState(changed, linking)).toBe('/docs/a/b?x=2');
});

test('serializes a state that has no original URL', () => {
  const withoutPath = withFocusedRoute(stateFor('/user/1'), (route) => {
    delete route.path;
  });

  expect(getPathForState(withoutPath, linking)).toBe('/user/1');
});
