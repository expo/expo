import React from 'react';
import { Text } from 'react-native';

import { Link, useGlobalSearchParams, useLocalSearchParams } from '../exports';
import { store } from '../global-state/router-store';
import { screen, fireEvent, renderRouter } from '../testing-library';

it('can preview a route without updating the state', () => {
  renderRouter({
    index: () => {
      return (
        <Link testID="link" href="/test" preview>
          Test
        </Link>
      );
    },
    test: () => {
      return <Text testID="text">Test</Text>;
    },
  });

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  expect(screen.queryByTestId('text')).toBeNull();

  fireEvent(screen.getByTestId('link'), 'onLongPress');

  // State has not updated
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  // But the route is visible
  expect(screen.queryByTestId('text')).toBeVisible();
});

it('can preview a route with params', () => {
  renderRouter({
    index: () => {
      return (
        <Link testID="link" href="/test" preview>
          Test
        </Link>
      );
    },
    '[slug]': function Slug() {
      return <Text testID="text">{useLocalSearchParams().slug}</Text>;
    },
  });

  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  expect(screen.queryByTestId('text')).toBeNull();

  fireEvent(screen.getByTestId('link'), 'onLongPress');

  // State has not updated
  expect(store.rootStateSnapshot()).toStrictEqual({
    routes: [{ name: 'index', path: '/' }],
    stale: true,
  });

  // But the route is visible
  expect(screen.queryByTestId('text')).toHaveTextContent('test');
});

it('inherits parent params', () => {
  renderRouter(
    {
      '[one]': () => {
        return (
          <Link testID="link" href="/hello/world" preview>
            Test
          </Link>
        );
      },
      '[one]/[two]': function Slug() {
        return <Text testID="text">{JSON.stringify(useGlobalSearchParams())}</Text>;
      },
    },
    {
      initialUrl: '/hello',
    }
  );

  expect(screen.queryByTestId('text')).toBeNull();

  fireEvent(screen.getByTestId('link'), 'onLongPress');

  expect(screen.queryByTestId('text')).toHaveTextContent(`{"one":"hello","two":"world"}`);
});
