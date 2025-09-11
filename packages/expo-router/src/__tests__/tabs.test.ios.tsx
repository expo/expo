import { fireEvent, act, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, View } from 'react-native';

import { router } from '../exports';
import { store } from '../global-state/router-store';
import { useSegments } from '../hooks';
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

  expect(indexCalls).toHaveBeenCalledTimes(0);

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
    preloadedRoutes: [],
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        params: undefined,
        state: {
          history: [
            {
              key: expect.any(String),
              type: 'route',
            },
          ],
          index: 1,
          key: expect.any(String),
          preloadedRouteKeys: [],
          routeNames: ['one', 'two'],
          routes: [
            {
              key: expect.any(String),
              name: 'one',
              params: undefined,
              path: '/one',
            },
            {
              key: expect.any(String),
              name: 'two',
              params: {},
              path: undefined,
            },
          ],
          stale: false,
          type: 'tab',
        },
      },
    ],
    stale: false,
    type: 'stack',
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
