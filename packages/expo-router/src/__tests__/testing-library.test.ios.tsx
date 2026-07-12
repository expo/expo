import { act, screen } from '@testing-library/react-native';
import { stripVTControlCharacters } from 'node:util';
import { Text } from 'react-native';

import { router } from '../imperative-api';
import { renderRouter } from '../testing-library';
import { Slot } from '../views/Navigator';

function getThrownMessage(fn: () => void): string {
  try {
    fn();
  } catch (e) {
    return stripVTControlCharacters((e as Error).message);
  }
  throw new Error('Expected function to throw');
}

/*
 * Smoke Tests for the Testing Library. While we use these functions in the other tests, we want to make sure they work as expected.
 */
describe('toHavePathname', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathname('/home');
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHavePathname('/xyz'));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).not.toHavePathname('/home'));
    expect(message).toMatchSnapshot();
  });
});

describe('toHavePathnameWithParams', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHavePathnameWithParams('/home?test=true');
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHavePathnameWithParams('/xyz'));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() =>
      expect(screen).not.toHavePathnameWithParams('/home?test=true')
    );
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveSegments', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    expect(screen).toHaveSegments(['[slug]']);
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveSegments(['xyz']));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).not.toHaveSegments(['[slug]']));
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveSearchParams', () => {
  it('correctly matches', () => {
    renderRouter(['[slug]/[...catchAll]'], { initialUrl: '/home/long/name?test=true' });
    expect(screen).toHaveSearchParams({ slug: 'home', test: 'true', catchAll: ['long', 'name'] });
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveSearchParams({ slug: 'xyz' }));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const params = { slug: 'home', test: 'true' };
    const message = getThrownMessage(() => expect(screen).not.toHaveSearchParams(params));
    expect(message).toMatchSnapshot();
  });
});

describe('toHaveRouterState', () => {
  // This test is currently broken in React Navigation v7 as @react-navigation/routers still has the prerenderRoutes key
  it.skip('correctly matches', () => {
    renderRouter(['[slug]', '[...catchAll]', 'directory/page'], { initialUrl: '/home?test=true' });
    act(() => router.navigate('/directory/page'));
    expect(screen).toHaveRouterState({
      index: 1,
      key: expect.any(String),
      routeNames: ['directory/page', '[slug]', '[...catchAll]'],
      routes: [
        {
          key: expect.any(String),
          name: '[slug]',
          params: {
            slug: 'home',
            test: 'true',
          },
          path: '/home?test=true',
        },
        {
          key: expect.any(String),
          name: 'directory/page',
          params: {},
          path: undefined,
        },
      ],
      stale: false,
      type: 'stack',
    });
  });

  it('fails with the correct message', () => {
    renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const message = getThrownMessage(() => expect(screen).toHaveRouterState({ routes: [] }));
    expect(message).toMatchSnapshot();
  });

  it('fails with the correct message for a .not assertion', () => {
    const result = renderRouter(['[slug]'], { initialUrl: '/home?test=true' });
    const state = result.getRouterState();
    const message = getThrownMessage(() => expect(screen).not.toHaveRouterState(state));
    expect(message).toMatchSnapshot();
  });
});

describe('MockContextConfig variants', () => {
  it('renders routes from a string array config', () => {
    renderRouter(['index', 'profile/[id]'], { initialUrl: '/profile/evan' });

    expect(screen).toHavePathname('/profile/evan');
    expect(screen).toHaveSegments(['profile', '[id]']);
  });

  it('renders object configs with layouts', () => {
    renderRouter(
      {
        _layout: () => <Text testID="layout">Layout</Text>,
        index: () => <Text testID="index">Index</Text>,
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('layout')).toBeVisible();
  });

  it('renders file-system contexts with in-memory overrides', () => {
    renderRouter(
      {
        appDir: 'src/__tests__/fixtures/context-stubs',
        overrides: {
          _layout: () => <Slot />,
          index: () => <Text testID="override">Override</Text>,
        },
      },
      { initialUrl: '/' }
    );

    expect(screen.getByTestId('override')).toBeVisible();
  });
});

// https://github.com/expo/expo/issues/46864
describe('fake timers', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('preserves a system time mocked with jest.setSystemTime', () => {
    const mockNow = new Date('2025-06-17T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    renderRouter(['[slug]'], { initialUrl: '/home' });

    // `renderRouter` calls `jest.useFakeTimers()` internally to control navigator
    // animations. That must not reset the system time the user mocked.
    expect(new Date().toISOString()).toBe(mockNow.toISOString());
    expect(Date.now()).toBe(mockNow.getTime());
  });

  it('renders the mocked Date.now() in a component', () => {
    const mockNow = new Date('2025-06-17T12:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(mockNow);

    renderRouter({
      index: () => (
        <>
          <Text testID="now-iso">{new Date().toISOString()}</Text>
          <Text testID="now-num">{Date.now()}</Text>
        </>
      ),
    });

    expect(screen.getByTestId('now-iso')).toHaveTextContent(mockNow.toISOString());
    expect(screen.getByTestId('now-num')).toHaveTextContent(String(mockNow.getTime()));
  });

  it('does not crash when setSystemTime is unavailable (legacy fake timers)', () => {
    // Legacy fake timers throw on `setSystemTime`. `renderRouter` must still work for those users.
    const setSystemTime = jest.spyOn(jest, 'setSystemTime').mockImplementation(() => {
      throw new TypeError('jest.setSystemTime() is not available when using legacy fake timers');
    });

    expect(() => renderRouter(['[slug]'], { initialUrl: '/home' })).not.toThrow();

    setSystemTime.mockRestore();
  });
});
