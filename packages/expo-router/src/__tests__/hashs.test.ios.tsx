import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../exports';
import { store } from '../global-state/router-store';
import { renderRouter } from '../testing-library';
import { parseUrlUsingCustomBase } from '../utils/url';

it('can push a hash url', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  act(() => router.push('/test#a'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();

  act(() => router.push('/test#b'));
  act(() => router.push('/test#b'));
  act(() => router.push('/test#c'));

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
          index: 4,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index', 'test'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: undefined,
              path: '/',
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {
                '#': 'a',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {
                '#': 'b',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {
                '#': 'b',
              },
              path: undefined,
            },
            {
              key: expect.any(String),
              name: 'test',
              params: {
                '#': 'c',
              },
              path: undefined,
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

it('works alongside with search params', () => {
  renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Add a hash
  act(() => router.navigate('/test?a=1#hash1'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=1#hash1');
  expect(screen).toHaveSearchParams({ a: '1', '#': 'hash1' });

  act(() => router.navigate('/test?a=2#hash2'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=2#hash2');
  expect(screen).toHaveSearchParams({ a: '2', '#': 'hash2' });

  act(() => router.navigate('/test?a=3'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=3');
  expect(screen).toHaveSearchParams({ a: '3' });
});

it.each(['/test#myhash', parseUrlUsingCustomBase('/test#myhash')])(
  'initialUrl=%p with hash resolves correctly',
  (url) => {
    renderRouter(
      {
        index: () => <Text testID="index" />,
        test: () => <Text testID="test" />,
      },
      { initialUrl: url }
    );

    expect(screen.getByTestId('test')).toBeOnTheScreen();
    expect(screen).toHavePathname('/test');
    expect(screen).toHaveSearchParams({ '#': 'myhash' });
  }
);

it.each(['/test?a=1#myhash', parseUrlUsingCustomBase('/test?a=1#myhash')])(
  'initialUrl=%p with search params and hash maintains RFC order',
  (url) => {
    renderRouter(
      {
        index: () => <Text testID="index" />,
        test: () => <Text testID="test" />,
      },
      { initialUrl: url }
    );

    expect(screen.getByTestId('test')).toBeOnTheScreen();
    expect(screen).toHavePathname('/test');
    expect(screen).toHavePathnameWithParams('/test?a=1#myhash');
    expect(screen).toHaveSearchParams({ a: '1', '#': 'myhash' });
  }
);

it.each(['/#section', parseUrlUsingCustomBase('/#section')])(
  'initialUrl=%p with hash on index route',
  (url) => {
    renderRouter(
      {
        index: () => <Text testID="index" />,
      },
      { initialUrl: url }
    );

    expect(screen.getByTestId('index')).toBeOnTheScreen();
    expect(screen).toHavePathname('/');
    expect(screen).toHaveSearchParams({ '#': 'section' });
  }
);

it.each(['/test?a=1', parseUrlUsingCustomBase('/test?a=1')])(
  'initialUrl=%p with search params but no hash works unchanged',
  (url) => {
    renderRouter(
      {
        index: () => <Text testID="index" />,
        test: () => <Text testID="test" />,
      },
      { initialUrl: url }
    );

    expect(screen.getByTestId('test')).toBeOnTheScreen();
    expect(screen).toHavePathname('/test');
    expect(screen).toHavePathnameWithParams('/test?a=1');
    expect(screen).toHaveSearchParams({ a: '1' });
  }
);

it.each(['/test#myhash?a=1', parseUrlUsingCustomBase('/test#myhash?a=1')])(
  'when url is malformed initialUrl=%p the hash and query param are treated as search param',
  (url) => {
    renderRouter(
      {
        index: () => <Text testID="index" />,
        test: () => <Text testID="test" />,
      },
      { initialUrl: url }
    );

    expect(screen.getByTestId('test')).toBeOnTheScreen();
    expect(screen).toHavePathname('/test');
    expect(screen).toHavePathnameWithParams('/test#myhash?a=1');
    expect(screen).toHaveSearchParams({ '#': 'myhash?a=1' });
  }
);

it('navigating to the same route with a hash will only rerender the screen', () => {
  renderRouter({
    index: () => <Text testID="index" />,
  });

  expect(store.state).toStrictEqual({
    routes: [
      {
        name: '__root',
        state: {
          routes: [
            {
              name: 'index',
              path: '/',
            },
          ],
        },
      },
    ],
  });

  act(() => router.navigate('/?#hash1'));

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
          index: 0,
          key: expect.any(String),
          preloadedRoutes: [],
          routeNames: ['index'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {
                '#': 'hash1',
              },
              path: '/',
            },
          ],
          stale: false,
          type: 'stack',
        },
      },
    ],
    stale: false,
    type: 'stack',
  });
});
