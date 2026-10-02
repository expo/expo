import { act, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { router } from '../exports';
import { navigationRef } from '../global-state/navigationRef';
import { renderRouter } from '../testing-library';
import { parseUrlUsingCustomBase } from '../utils/url';
import { expectCompleteStateToMatch } from './assertCompleteState';

it('can push a hash url', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  await act(() => router.push('/test#a'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();

  await act(() => router.push('/test#b'));
  await act(() => router.push('/test#b'));
  await act(() => router.push('/test#c'));

  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 4,
          key: expect.any(String),
          routeNames: ['index', 'test'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
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
          routeKeySeq: expect.any(Number),
          type: 'stack',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});

it('works alongside with search params', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
    test: () => <Text testID="test" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Add a hash
  await act(() => router.navigate('/test?a=1#hash1'));
  expect(screen.getByTestId('test')).toBeOnTheScreen();
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=1#hash1');
  expect(screen).toHaveSearchParams({ a: '1', '#': 'hash1' });

  await act(() => router.navigate('/test?a=2#hash2'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=2#hash2');
  expect(screen).toHaveSearchParams({ a: '2', '#': 'hash2' });

  await act(() => router.navigate('/test?a=3'));
  expect(screen).toHaveSegments(['test']);
  expect(screen).toHavePathname('/test');
  expect(screen).toHavePathnameWithParams('/test?a=3');
  expect(screen).toHaveSearchParams({ a: '3' });
});

it.each(['/test#myhash', parseUrlUsingCustomBase('/test#myhash')])(
  'initialUrl=%p with hash resolves correctly',
  async (url) => {
    await renderRouter(
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
  async (url) => {
    await renderRouter(
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
  async (url) => {
    await renderRouter(
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
  async (url) => {
    await renderRouter(
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
  async (url) => {
    await renderRouter(
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

it('navigating to the same route with a hash will only rerender the screen', async () => {
  await renderRouter({
    index: () => <Text testID="index" />,
  });

  expectCompleteStateToMatch(navigationRef.getRootState(), {
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              path: '/',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
  });

  await act(() => router.navigate('/?#hash1'));

  expect(navigationRef.getRootState()).toStrictEqual({
    index: 0,
    key: expect.any(String),
    routeNames: ['__root', '+not-found', '_sitemap'],
    routes: [
      {
        key: expect.any(String),
        name: '__root',
        state: {
          index: 0,
          key: expect.any(String),
          routeNames: ['index'],
          routes: [
            {
              key: expect.any(String),
              name: 'index',
              params: {
                '#': 'hash1',
              },
              path: '/?#hash1',
            },
          ],
          stale: false,
          routeKeySeq: expect.any(Number),
          type: 'stack',
        },
      },
    ],
    stale: false,
    routeKeySeq: expect.any(Number),
    type: 'stack',
  });
});
