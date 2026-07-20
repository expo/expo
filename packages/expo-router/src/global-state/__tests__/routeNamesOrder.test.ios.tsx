import { Text } from 'react-native';

import { Stack } from '../../layouts/Stack';
import { Tabs } from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';
import { resetRouterSpies, routerSpyCalls } from './routerSpies';

// Guards that the compiled `routeNames` order (sibling order in the seed) matches the rendered
// `<Screen>` order end-to-end. If they diverged, `useNavigationBuilder` would dispatch a
// `RECONCILE_ROUTE_NAMES` action on mount to reconcile — so asserting it never fires proves the
// compiled order is authoritative and the seed can be committed verbatim (Step 3).
//
// Step 3's container change (seed `store.state` verbatim, no staling) is already present in the
// working tree, so these run against the intended end state.
//
// Not-found configurations are covered exhaustively in notFoundRouteNames.test.ios.tsx.
//
// Spy mechanism: same as seedFidelity — `jest.mock` the leaf router modules and record calls via
// the pass-through wrapper in ./routerSpies. See that file for details.
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

it('does not reorder route names for a stack nested in tabs', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      index: () => <Text>home</Text>,
      'feed/_layout': () => <Stack />,
      'feed/index': () => <Text>feed-index</Text>,
      'feed/[id]': () => <Text>feed-detail</Text>,
    },
    { initialUrl: '/feed/42' }
  );

  expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
});

it('does not reorder route names when deep linking through a route group', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      '(group)/_layout': () => <Stack />,
      '(group)/index': () => <Text>group-index</Text>,
      '(group)/detail': () => <Text>group-detail</Text>,
    },
    { initialUrl: '/detail' }
  );

  expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
});

it('does not reorder route names when a deep link falls through to +not-found', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text>home</Text>,
      '+not-found': () => <Text>not-found</Text>,
    },
    { initialUrl: '/does-not-exist' }
  );

  expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
});
