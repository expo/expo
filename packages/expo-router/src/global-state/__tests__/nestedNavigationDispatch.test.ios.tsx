import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Stack } from '../../layouts/Stack';
import { Tabs } from '../../layouts/Tabs';
import { renderRouter } from '../../testing-library';
import { router } from '../router';
import { store } from '../store';
import { resetRouterSpies, routerSpyCalls } from './routerSpies';

// Replaces the legacy `useNavigationBuilder` render-time nested-param tests (`navigate('parent',
// { screen })` / `params.state` resets) that used to live in `core/__tests__/index.test.ios.tsx`.
// Those exercised a bridge that reduced `route.params.screen/state/initial` locally during render.
// That bridge is gone: nested navigation now goes entirely through the container's root dispatch
// against the compiler-seeded global tree. These tests assert the intended global-path behavior —
// the destination navigator's slice is installed into the committed store by the root reducer, is
// navigable afterwards, and the render path performs no structural repair.
//
// Spy mechanism (see ./routerSpies): the leaf router modules are `jest.mock`ed with a pass-through
// wrapper recording every `getInitialState` and `RECONCILE_ROUTE_NAMES` reduction.
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

const tabsWithNestedStacks = {
  _layout: () => <Tabs />,
  index: () => <Text>home</Text>,
  'feed/_layout': () => <Stack />,
  'feed/index': () => <Text>feed-index</Text>,
  'feed/[id]': () => <Text>feed-detail</Text>,
};

function focusedLeaf(state: any): { name: string; params?: object } {
  let current: any = state;
  while (current?.routes?.[current.index]?.state) {
    current = current.routes[current.index].state;
  }
  return current.routes[current.index];
}

function findSlice(state: any, key: string): any {
  if (state == null) {
    return undefined;
  }
  if (state.key === key) {
    return state;
  }
  for (const route of state.routes) {
    const child = route.state;
    if (child?.stale === false) {
      const found = findSlice(child, key);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

it('navigates into a never-visited nested navigator through root dispatch', () => {
  renderRouter(tabsWithNestedStacks, { initialUrl: '/' });

  expect(screen.getByText('home')).toBeVisible();

  act(() => router.navigate('/feed/42'));

  expect(screen.getByText('feed-detail')).toBeVisible();
  const leaf = focusedLeaf(store.state);
  expect(leaf.name).toBe('[id]');
  expect(leaf.params).toEqual({ id: '42' });
});

it('installs the destination child slice into the committed global tree (navigable, not render-local)', () => {
  renderRouter(tabsWithNestedStacks, { initialUrl: '/' });

  act(() => router.navigate('/feed/42'));

  // The feed stack existed nowhere in the `/` seed; root dispatch inserted its complete slice.
  const feedRoute = (store.state as any).routes[0].state.routes.find(
    (r: any) => r.name === 'feed'
  );
  const feedStack = findSlice(store.state, feedRoute.state.key);
  expect(feedStack?.stale).toBe(false);
  expect(feedStack?.routes.map((r: any) => r.name)).toEqual(['[id]']);
});

it('reduces GO_BACK inside a nested stack through root dispatch', () => {
  renderRouter(tabsWithNestedStacks, { initialUrl: '/' });

  act(() => router.navigate('/feed/42'));
  act(() => router.push('/feed/99'));

  expect(focusedLeaf(store.state).params).toEqual({ id: '99' });
  expect(router.canGoBack()).toBe(true);

  act(() => router.back());

  expect(focusedLeaf(store.state).params).toEqual({ id: '42' });
  expect(screen.getByText('feed-detail')).toBeVisible();
});

it('does not trigger route-name repair when navigating into a nested navigator', () => {
  renderRouter(tabsWithNestedStacks, { initialUrl: '/' });

  resetRouterSpies();
  act(() => router.navigate('/feed/42'));

  // Route names are static; a root-dispatched nested navigation must not reconcile them.
  expect(routerSpyCalls.reconcileRouteNames).toHaveLength(0);
});
