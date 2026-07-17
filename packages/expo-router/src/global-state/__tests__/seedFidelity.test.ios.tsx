import { Text } from 'react-native';

import { getStateFromPath } from '../../fork/getStateFromPath';
import { Stack } from '../../layouts/Stack';
import { Tabs } from '../../layouts/Tabs';
import { getMockConfig, renderRouter } from '../../testing-library';
import { store } from '../store';
import { resetRouterSpies, routerSpyCalls } from './routerSpies';

// Step 3 of the "global navigation state" refactor: the compiled state from `getStateFromPath`
// seeds the container VERBATIM. The first committed state must deep-equal the compiled seed, so no
// navigator falls back to `getInitialState` and no `RECONCILE_ROUTE_NAMES` reduction rebuilds a
// slice at render.
//
// Fixture choice matters for an EXACT toEqual: the live tree must not gain routes the compiled seed
// lacks. The JS bottom-tab navigator preloads its implicit back-stack anchor at effect time and
// appends it to the routes TAIL, so an implicit-anchor tab deep link ends up `[feed, index]` — not
// the compiled `[feed]`. We therefore target two shapes with zero effect-time preload divergence:
//   1. Nested stacks: stacks never preload siblings, so only the state keys differ.
//   2. Declared-anchor tabs: the compiler materializes the declared anchor at the FRONT already, and
//      preloading an already-present anchor is a no-op, so live and compiled match modulo keys.
//
// Spy mechanism (see ./routerSpies): each test file `jest.mock`s the leaf router modules
// (`react-navigation/routers/StackRouter`, `.../TabRouter`) and replaces the exported factory with a
// pass-through wrapper that records every `getInitialState` call and `RECONCILE_ROUTE_NAMES`
// reduction. Every navigator imports these factories through the `native`
// -> `core` -> `routers` barrel chain, so wrapping the leaf module intercepts the whole tree. The
// wrapper delegates to the real router, so behavior is unchanged — it only observes what
// `useNavigationBuilder` invokes on a deep-link mount.
jest.mock('../../react-navigation/routers/StackRouter', () => {
  const actual = jest.requireActual(
    '../../react-navigation/routers/StackRouter'
  ) as typeof import('../../react-navigation/routers/StackRouter');
  const { wrapRouterFactory } = require('./routerSpies');
  return { ...actual, StackRouter: wrapRouterFactory('Stack', actual.StackRouter) };
});
jest.mock('../../react-navigation/routers/TabRouter', () => {
  const actual = jest.requireActual(
    '../../react-navigation/routers/TabRouter'
  ) as typeof import('../../react-navigation/routers/TabRouter');
  const { wrapRouterFactory } = require('./routerSpies');
  return { ...actual, TabRouter: wrapRouterFactory('Tab', actual.TabRouter) };
});

beforeEach(() => resetRouterSpies());

// Nested stacks all the way down; deep-link to a multi-segment dynamic leaf. Stacks never preload,
// so the live tree can only differ from the compiled seed by its state keys.
const nestedStacksApp = {
  _layout: () => <Stack />,
  index: () => <Text>root</Text>,
  'settings/_layout': () => <Stack />,
  'settings/index': () => <Text>settings</Text>,
  'settings/profile/_layout': () => <Stack />,
  'settings/profile/index': () => <Text>profile</Text>,
  'settings/profile/[id]': () => <Text>profile-id</Text>,
};

// Tabs with a DECLARED anchor, deep-linked to a non-anchor leaf tab. The compiled seed materializes
// the anchor at the front; the effect-time preload of that already-present anchor is a no-op.
const declaredAnchorTabsApp = {
  _layout: {
    default: () => <Tabs />,
    unstable_settings: { anchor: 'index' },
  },
  index: () => <Text>home</Text>,
  'feed/_layout': () => <Stack />,
  'feed/index': () => <Text>feed-index</Text>,
  'feed/[id]': () => <Text>feed-detail</Text>,
};

// Test A: the live root state committed on a deep-link mount must deep-equal the compiled seed.
// Fails today: the live tree carries freshly-minted live keys where the compiled seed carries
// deterministic keys from `getStateKey(parentRouteKey)` / `getRouteKey({ stateKey, name, index })` at
// every level.
it('commits the compiled seed verbatim for a deep link through nested stacks', () => {
  const initialUrl = '/settings/profile/42';

  renderRouter(nestedStacksApp, { initialUrl });

  const compiled = getStateFromPath(initialUrl, getMockConfig(nestedStacksApp));

  expect(store.navigationRef.current?.getRootState()).toEqual(compiled);
});

it('commits the compiled seed verbatim for a declared-anchor tabs deep link', () => {
  const initialUrl = '/feed/42';

  renderRouter(declaredAnchorTabsApp, { initialUrl });

  const compiled = getStateFromPath(initialUrl, getMockConfig(declaredAnchorTabsApp));

  expect(store.navigationRef.current?.getRootState()).toEqual(compiled);
});

// Test B: on a verbatim-seeded mount no navigator rebuilds its slice, so none of the router's
// repair functions run. Every navigator reads its committed slice straight from the store; there is
// no init/rehydrate/route-names-change pass over the seed.
it('does not rebuild navigator slices when seeding a deep link', () => {
  renderRouter(nestedStacksApp, { initialUrl: '/settings/profile/42' });

  // A complete nested seed means no navigator falls back to `getInitialState`, and compiled
  // `routeNames` order matches the rendered order so no route-names reconciliation fires over the
  // verbatim-committed slice.
  expect(routerSpyCalls.getInitialState).toHaveLength(0);
  expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
});
