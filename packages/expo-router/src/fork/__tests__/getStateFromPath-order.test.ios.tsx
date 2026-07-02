import { act } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../../imperative-api';
import { store } from '../../global-state/router-store';
import Stack from '../../layouts/StackClient';
import { Tabs } from '../../layouts/Tabs';
import { getMockConfig, renderRouter } from '../../testing-library';
import { getStateFromPath } from '../getStateFromPath';

// Walk the focused branch and collect each navigator level's `routeNames`, top to bottom.
function collectRouteNames(state: any): string[][] {
  const levels: string[][] = [];
  let current = state;
  while (current?.routeNames) {
    levels.push([...current.routeNames]);
    const focused = current.routes[current.index ?? 0];
    current = focused?.state;
  }
  return levels;
}

// The compiled state's per-level `routeNames` must equal what the rendered navigator produces — same
// members, SAME ORDER — at every level down the focused branch. Order matters: `useNavigationBuilder`
// compares `routeNames` order-sensitively (`isArrayEqual`) and would otherwise trigger a render-time
// repair (`getStateForRouteNamesChange`) that re-mints the compiled keys. Both orders must derive
// from the one sorted source (`sortRoutesWithInitial`). The initial render is still stale, so we
// navigate first to force the live navigators to expose their `routeNames`.
it('emits routeNames in the exact same order as the live navigator, at every level', () => {
  // One app definition, used for BOTH the live render and the compiled config — so `initialRouteName`
  // (from `unstable_settings`) and the child order come from the exact same source.
  const app = {
    // Root stack (the `__root` slot's navigator).
    _layout: () => <Stack />,
    index: () => <Text>index</Text>,
    // Nested navigator (tabs) inside a route group. `anchor` declares an initial route. The tab
    // files are declared bbb, aa, index — an order that differs from the sorted order the navigator
    // actually renders.
    '(group)/_layout': {
      unstable_settings: { anchor: 'bbb' },
      default: () => <Tabs />,
    },
    '(group)/bbb': () => <Text>bbb</Text>,
    '(group)/aa': () => <Text>aa</Text>,
    '(group)/index': () => <Text>group-index</Text>,
  };

  renderRouter(app, { initialUrl: '/' });

  // Navigate into the nested tabs so every live navigator level is mounted and exposes routeNames.
  act(() => router.navigate('/aa'));

  const live = collectRouteNames(store.state);
  expect(live.length).toBeGreaterThan(1);

  const config = getMockConfig(app);
  const compiled = collectRouteNames(getStateFromPath('/aa', config));

  // The compiler must produce exactly the same number of navigator levels as the live tree, and
  // every level must be an exact-order match. A compiled level with no live counterpart (or vice
  // versa) is a failure.
  expect(compiled.length).toBe(live.length);
  for (let level = 0; level < Math.max(compiled.length, live.length); level++) {
    expect(compiled[level]).toBeDefined();
    expect(live[level]).toBeDefined();
    // Exact order, not just membership.
    expect(compiled[level]).toEqual(live[level]);
  }

  // Pin the sorted order explicitly so a regression in either source is caught here too.
  // Root slot: `__root` first, then not-found before sitemap (matches ExpoRoot render order).
  expect(live[0]).toEqual(['__root', '+not-found', '_sitemap']);
  // Nested tabs: anchor `bbb` hoisted first, then index rule, then the remaining `aa`.
  expect(live[live.length - 1]).toEqual(['bbb', 'index', 'aa']);
});
