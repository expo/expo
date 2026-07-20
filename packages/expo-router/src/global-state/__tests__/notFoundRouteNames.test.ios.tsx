import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Stack } from '../../layouts/Stack';
import { renderRouter } from '../../testing-library';
import { resetRouterSpies, routerSpyCalls } from './routerSpies';

// The compiled root `routeNames` (the internal-slot / `__root` stack level) must exactly equal the
// rendered `<Screen>` order at that level for EVERY not-found configuration. When they diverge,
// `useNavigationBuilder` dispatches a `RECONCILE_ROUTE_NAMES` action on mount to reconcile — which
// self-heals but violates the Step-3 contract that the seed commits verbatim. Asserting it never
// fires proves the invariant holds.
//
// Spy mechanism: same as routeNamesOrder — `jest.mock` the leaf router modules and record calls via
// the pass-through wrapper in ./routerSpies.
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

describe('root routeNames match the rendered order for every not-found configuration', () => {
  // No app-defined `+not-found`: the internal NOT_FOUND screen handles the unmatched deep link, and
  // both compiled + rendered root routeNames are `[__root, +not-found, _sitemap]`.
  it('no app-defined +not-found', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text>home</Text>,
      },
      { initialUrl: '/does-not-exist' }
    );

    expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
  });

  // App-defined ROOT-level `+not-found`: the app's catch-all lives nested under `__root` and already
  // handles everything, so the compiler omits `+not-found` from the root routeNames
  // (`[__root, _sitemap]`). Content must NOT render the internal NOT_FOUND screen, or the rendered
  // root would gain a `+not-found` the compiler never emitted.
  it('app-defined ROOT-level +not-found', () => {
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

  // App-defined NESTED-group `+not-found`: a nested-group catch-all is NOT a top-level screen, so it
  // does not suppress the internal root NOT_FOUND (only a ROOT-level app catch-all does). Compiled +
  // rendered root routeNames are both `[__root, +not-found, _sitemap]`.
  it('app-defined NESTED-group +not-found', () => {
    renderRouter(
      {
        _layout: () => <Stack />,
        index: () => <Text>home</Text>,
        '(group)/_layout': () => <Stack />,
        '(group)/+not-found': () => <Text>group-not-found</Text>,
      },
      { initialUrl: '/does-not-exist' }
    );

    expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
  });
});

// Suppressing the internal NOT_FOUND screen must not break the app's own root-level `+not-found`: an
// unmatched deep link still renders it, and the `not-found` rest param survives so the original URL
// is preserved.
it('app-defined ROOT-level +not-found still renders and preserves the URL', () => {
  renderRouter(
    {
      _layout: () => <Stack />,
      index: () => <Text testID="home">home</Text>,
      '+not-found': () => <Text testID="app-not-found">app-not-found</Text>,
    },
    { initialUrl: '/does-not-exist' }
  );

  expect(screen.getByTestId('app-not-found')).toBeVisible();
  expect(screen).toHavePathname('/does-not-exist');
});
