import { expect, test } from '@jest/globals';

import { NativeBottomTabsRouter } from '../NativeBottomTabsRouter';
import { CommonActions, type RouterConfigOptions } from '../../react-navigation/routers';

// The NAVIGATE override delegates to the tab router (which attaches payload.state on a fresh
// identity) and then rebuilds only the navigated route's params via `{ ...route, params }`. These
// tests pin that the attached `.state` survives that spread and the internal param remap.

test('navigate to an absent tab keeps the attached payload.state', () => {
  const router = NativeBottomTabsRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const subtree = {
    stale: false as const,
    key: 'root:qux:0',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:qux:0:inner:0', name: 'inner' }],
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [{ key: 'baz', name: 'baz' }],
    },
    CommonActions.navigate({ name: 'qux', state: subtree }),
    options
  );

  const qux = next!.routes.find((r) => r.name === 'qux')!;
  expect(qux.key).toBe('root:qux:0');
  expect((qux as any).state).toBe(subtree);
});

test('navigate re-keying an existing tab keeps the attached payload.state through the param remap', () => {
  const router = NativeBottomTabsRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  const subtree = {
    stale: false as const,
    key: 'root:bar:1',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:bar:1:inner:0', name: 'inner' }],
  };

  // `bar` is present (so the override's `route.map` remap runs), and the id change re-keys it —
  // a fresh identity that gets payload.state. The remap must not drop it.
  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [
        {
          key: 'bar-42',
          name: 'bar',
          params: { answer: 42 },
          state: {
            stale: false,
            key: 'bar-42',
            index: 0,
            routeNames: ['inner'],
            routes: [{ key: 'bar-42:inner:0', name: 'inner' }],
          },
        } as any,
      ],
    },
    CommonActions.navigate({ name: 'bar', params: { answer: 43 }, state: subtree }),
    options
  );

  const bar = next!.routes.find((r) => r.name === 'bar')!;
  expect(bar.key).toBe('root:bar:1');
  expect((bar as any).state).toBe(subtree);
});
