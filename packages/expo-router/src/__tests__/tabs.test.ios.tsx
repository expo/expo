import { fireEvent, act, screen } from '@testing-library/react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { router } from '../exports';
import { store } from '../global-state/router-store';
import { useLocalSearchParams, useSegments } from '../hooks';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

it('should not render generated screens', () => {
  renderRouter({
    _layout: () => <Tabs />,
    index: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 1 of 1').parent;

  expect(tabList?.children).toHaveLength(1);
});

it('screens can be hidden', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="hidden" />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    hidden: () => <Text testID="index">Index</Text>,
  });

  expect(screen.getByTestId('index')).toBeVisible();

  const tabList = screen.getByLabelText('index, tab, 2 of 2').parent;

  expect(tabList?.children).toHaveLength(1);
});

it('has correct routeInfo when switching tabs as a nested navigator - using api', () => {
  const layoutCalls = jest.fn();
  const indexCalls = jest.fn();
  const exploreCalls = jest.fn();

  /**
   * In this instance, React Navigation fires the state update before the screen is rendered.
   */
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': function Layout() {
        layoutCalls(useSegments());
        return <Tabs />;
      },
      '(tabs)/index': function Index() {
        indexCalls(useSegments());
        return <Text testID="index">Index</Text>;
      },
      '(tabs)/explore': function Explore() {
        exploreCalls(useSegments());
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/?test=123',
    }
  );

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).not.toHaveBeenCalled();

  jest.clearAllMocks();
  act(() => router.push('/explore'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  jest.clearAllMocks();
  act(() => router.push('/'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)']);
});

it('has correct routeInfo when switching tabs as a nested navigator - using press', () => {
  /**
   * This test exists because there are inconsistencies when using press vs the API.
   * This is due to how React Navigation fires events on press (inconsistent) vs API calls (consistent).
   */
  const layoutCalls = jest.fn();
  const indexCalls = jest.fn();
  const exploreCalls = jest.fn();

  /**
   * In this instance, React Navigation fires the state update before the screen is rendered.
   */
  renderRouter(
    {
      _layout: () => <Stack />,
      '(tabs)/_layout': function Layout() {
        layoutCalls(useSegments());
        return <Tabs />;
      },
      '(tabs)/index': function Index() {
        indexCalls(useSegments());
        return <Text testID="index">Index</Text>;
      },
      '(tabs)/explore': function Explore() {
        exploreCalls(useSegments());
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/?test=123',
    }
  );

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, ['(tabs)', 'explore']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['(tabs)', 'explore']);
});

it('has correct routeInfo when switching tabs using press', () => {
  /**
   * This test exists because there are inconsistencies when using press vs the API.
   * This is due to how React Navigation fires events on press (inconsistent) vs API calls (consistent).
   */
  const layoutCalls = jest.fn();
  const indexCalls = jest.fn();
  const exploreCalls = jest.fn();

  /**
   * In this instance, React Navigation fires the state update before the screen is rendered.
   */
  renderRouter(
    {
      _layout: function Layout() {
        layoutCalls(useSegments());
        return <Tabs />;
      },
      index: function Index() {
        indexCalls(useSegments());
        return <Text testID="index">Index</Text>;
      },
      explore: function Explore() {
        exploreCalls(useSegments());
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/explore',
    }
  );

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenCalledWith(['explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['explore']);

  // The initial route (index) is present in state.routes and renders even when
  // deep-linking to a non-initial route, so its component runs once at mount.
  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['explore']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, []);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith([]);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith([]);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenCalledWith(['explore']);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith(['explore']);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith(['explore']);

  jest.clearAllMocks();
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));

  expect(layoutCalls).toHaveBeenCalledTimes(1);
  expect(layoutCalls).toHaveBeenNthCalledWith(1, []);

  expect(indexCalls).toHaveBeenCalledTimes(1);
  expect(indexCalls).toHaveBeenCalledWith([]);

  expect(exploreCalls).toHaveBeenCalledTimes(1);
  expect(exploreCalls).toHaveBeenCalledWith([]);
});

it('does not remount the anchor (index) tab when switching tabs after deep-linking to a non-initial tab', () => {
  /**
   * Under the subset navigation-state model, a route's presence in `state.routes` means
   * it is loaded/rendered. With the default `backBehavior: 'firstRoute'`, the anchor
   * (index) tab is materialized into `state.routes` so it can sit at the bottom of the
   * back-stack — so it renders eagerly at mount even when deep-linking straight to a
   * non-initial tab. This test pins two things that must not regress:
   *   1. the anchor mounts exactly once on deep-link, and
   *   2. switching tabs afterward reconciles the anchor (re-renders) but never remounts
   *      it from scratch — its mount count stays bounded at 1.
   */
  const indexMounts = jest.fn();
  const indexRenders = jest.fn();
  const exploreMounts = jest.fn();

  renderRouter(
    {
      _layout: () => <Tabs />,
      index: function Index() {
        indexRenders();
        useEffect(() => {
          indexMounts();
        }, []);
        return <Text testID="index">Index</Text>;
      },
      explore: function Explore() {
        useEffect(() => {
          exploreMounts();
        }, []);
        return <Text testID="explore">Explore</Text>;
      },
    },
    {
      initialUrl: '/explore',
    }
  );

  // Deep-linked to a non-initial tab: the anchor still mounts exactly once.
  expect(indexMounts).toHaveBeenCalledTimes(1);
  expect(indexRenders).toHaveBeenCalledTimes(1);

  // Switch to the anchor tab and back.
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));
  fireEvent.press(screen.getByLabelText('explore, tab, 2 of 2'));
  fireEvent.press(screen.getByLabelText('index, tab, 1 of 2'));

  // The anchor was reconciled, not remounted: mount count stays bounded at 1.
  expect(indexMounts).toHaveBeenCalledTimes(1);
  // Re-renders are expected (segments change), but must stay bounded — not unbounded.
  expect(indexRenders.mock.calls.length).toBeLessThanOrEqual(6);
});

it('can push screens', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      one: () => <Text testID="one">One</Text>,
      two: () => <Text testID="two">Two</Text>,
    },
    {
      initialUrl: '/one',
    }
  );

  expect(screen.getByTestId('one')).toBeVisible();

  act(() => router.push('/two'));

  expect(screen.getByTestId('two')).toBeVisible();
});

it('works with goBack', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      one: () => <Text testID="one">One</Text>,
      two: () => <Text testID="two">Two</Text>,
      three: () => <Text testID="three">Three</Text>,
    },
    {
      initialUrl: '/one',
    }
  );

  expect(screen.getByTestId('one')).toBeVisible();

  act(() => router.push('/two'));
  act(() => router.push('/three'));

  expect(screen.getByTestId('three')).toBeVisible();

  act(() => router.back());

  // The default back behavior of tabs is first screen
  expect(screen.getByTestId('one')).toBeVisible();
});

it('works with goBack (history)', () => {
  renderRouter(
    {
      _layout: () => <Tabs backBehavior="history" />,
      one: () => <Text testID="one">One</Text>,
      two: () => <Text testID="two">Two</Text>,
      three: () => <Text testID="three">Three</Text>,
    },
    {
      initialUrl: '/one',
    }
  );

  expect(screen.getByTestId('one')).toBeVisible();

  act(() => router.push('/two'));
  act(() => router.push('/three'));

  expect(screen.getByTestId('three')).toBeVisible();

  act(() => router.back());

  expect(screen.getByTestId('two')).toBeVisible();
});

it('can use replace navigation', () => {
  renderRouter(
    {
      _layout: () => <Tabs />,
      one: () => <Text testID="one">One</Text>,
      two: () => <Text testID="two">Two</Text>,
    },
    {
      initialUrl: '/one',
    }
  );

  // The Tabs
  expect(screen.getByLabelText('one, tab, 1 of 2')).toBeVisible();
  expect(screen.getByLabelText('two, tab, 2 of 2')).toBeVisible();

  expect(screen.getByTestId('one')).toBeVisible();

  act(() => router.replace('/two'));
  expect(screen.getByTestId('two')).toBeVisible();
  expect(screen.getByLabelText('two, tab, 2 of 2')).toBeVisible();
  expect(store.state).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          // `replace` prunes the replaced `one` from the back stack: it moves past
          // the focused `two`, which lands at index 0 (so back is blocked).
          index: 0,
          key: expect.any(String),
          routeNames: ['one', 'two'],
          routes: [
            {
              key: expect.any(String),
              name: 'two',
              params: {},
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'one',
              path: '/one',
            },
          ],
          stale: false,
        },
      },
    ],
    stale: false,
  });
});

it('can use replace navigation with history backBehavior', () => {
  renderRouter(
    {
      _layout: () => <Tabs backBehavior="history" />,
      one: () => <Text testID="one">One</Text>,
      two: () => <Text testID="two">Two</Text>,
      three: () => <Text testID="three">Three</Text>,
    },
    {
      initialUrl: '/one',
    }
  );

  expect(screen.getByTestId('one')).toBeVisible();

  act(() => router.push('/two'));
  act(() => router.replace('/three'));

  expect(screen.getByTestId('three')).toBeVisible();

  act(() => router.back());

  // `replace` drops the route it replaced (`/two`) from the history, so back skips
  // it and returns to `/one`.
  expect(screen.getByTestId('one')).toBeVisible();
});

it('does not re-render when navigating to different tab', () => {
  const onOneRender = jest.fn();
  const onTwoRender = jest.fn();
  renderRouter(
    {
      _layout: () => <Tabs />,
      one: function One() {
        onOneRender();
        return <Text testID="one">One</Text>;
      },
      two: function Two() {
        onTwoRender();
        return <Text testID="two">Two</Text>;
      },
    },
    {
      initialUrl: '/one',
    }
  );

  expect(screen.getByTestId('one')).toBeVisible();
  expect(onOneRender).toHaveBeenCalledTimes(1);
  expect(onTwoRender).toHaveBeenCalledTimes(0);

  jest.clearAllMocks();
  act(() => router.push('/two'));

  expect(screen.getByTestId('two')).toBeVisible();
  expect(onOneRender).toHaveBeenCalledTimes(0);
  expect(onTwoRender).toHaveBeenCalledTimes(1);

  jest.clearAllMocks();
  act(() => router.push('/one'));

  expect(screen.getByTestId('one')).toBeVisible();
  expect(onOneRender).toHaveBeenCalledTimes(1);
  expect(onTwoRender).toHaveBeenCalledTimes(0);
});

it('updates route info, when going back to initial screen', () => {
  renderRouter({
    _layout: function Layout() {
      const segments = useSegments();
      return (
        <View>
          <Text testID="layout">{JSON.stringify(segments)}</Text>
          <Stack />
        </View>
      );
    },
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/index': function Index() {
      const segments = useSegments();
      return <Text testID="index">{JSON.stringify(segments)}</Text>;
    },
    second: function Second() {
      const segments = useSegments();
      return <Text testID="second">{JSON.stringify(segments)}</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('layout')).toBeVisible();
  expect(screen.getByTestId('index')).toHaveTextContent('["(tabs)"]');
  expect(screen.getByTestId('layout')).toHaveTextContent('["(tabs)"]');

  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.getByTestId('layout')).toBeVisible();
  expect(screen.getByTestId('second')).toHaveTextContent('["second"]');
  expect(screen.getByTestId('layout')).toHaveTextContent('["second"]');

  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('layout')).toBeVisible();
  expect(screen.getByTestId('index')).toHaveTextContent('["(tabs)"]');
  expect(screen.getByTestId('layout')).toHaveTextContent('["(tabs)"]');

  act(() => router.push('/second'));
  expect(screen.getByTestId('second')).toBeVisible();
  expect(screen.getByTestId('layout')).toBeVisible();
  expect(screen.getByTestId('second')).toHaveTextContent('["second"]');
  expect(screen.getByTestId('layout')).toHaveTextContent('["second"]');

  act(() => router.back());
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByTestId('layout')).toBeVisible();
  expect(screen.getByTestId('index')).toHaveTextContent('["(tabs)"]');
  expect(screen.getByTestId('layout')).toHaveTextContent('["(tabs)"]');
});

it('can set params for dynamic routes using href', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="[id]" options={{ href: '/1234' }} />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    '[id]': function Id() {
      const { id } = useLocalSearchParams();
      return <Text testID="id">{id}</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByLabelText('index, tab, 1 of 2')).toBeVisible();
  expect(screen.getByLabelText('[id], tab, 2 of 2')).toBeVisible();

  fireEvent.press(screen.getByLabelText('[id], tab, 2 of 2'));

  expect(screen.getByTestId('id')).toBeVisible();
  expect(screen.getByTestId('id')).toHaveTextContent('1234');
});

it('can set params for dynamic routes using href in nested folder', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="[id]/index" options={{ href: '/1234' }} />
        <Tabs.Screen name="[id]/second" options={{ href: '/2345/second' }} />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    '[id]/index': function Id() {
      const { id } = useLocalSearchParams();
      return <Text testID="id-index">{id}</Text>;
    },
    '[id]/second': function Id() {
      const { id } = useLocalSearchParams();
      return <Text testID="id-second">{id}</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByLabelText('index, tab, 1 of 3')).toBeVisible();
  expect(screen.getByLabelText('[id]/index, tab, 2 of 3')).toBeVisible();
  expect(screen.getByLabelText('[id]/second, tab, 3 of 3')).toBeVisible();

  fireEvent.press(screen.getByLabelText('[id]/index, tab, 2 of 3'));

  expect(screen.getByTestId('id-index')).toBeVisible();
  expect(screen.getByTestId('id-index')).toHaveTextContent('1234');

  fireEvent.press(screen.getByLabelText('[id]/second, tab, 3 of 3'));

  expect(screen.getByTestId('id-second')).toBeVisible();
  expect(screen.getByTestId('id-second')).toHaveTextContent('2345');
});

it('can set params for dynamic routes using href when nested stack is used', () => {
  renderRouter({
    _layout: () => (
      <Tabs>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="[id]" options={{ href: '/1234' }} />
      </Tabs>
    ),
    index: () => <Text testID="index">Index</Text>,
    '[id]/_layout': () => <Stack />,
    '[id]/index': function Id() {
      const { id } = useLocalSearchParams();
      return <Text testID="id-index">{id}</Text>;
    },
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen.getByLabelText('index, tab, 1 of 2')).toBeVisible();
  expect(screen.getByLabelText('[id], tab, 2 of 2')).toBeVisible();

  fireEvent.press(screen.getByLabelText('[id], tab, 2 of 2'));

  expect(screen.getByTestId('id-index')).toBeVisible();
  expect(screen.getByTestId('id-index')).toHaveTextContent('1234');
});
