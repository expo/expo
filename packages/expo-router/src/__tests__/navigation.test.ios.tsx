import Constants from 'expo-constants';
import React, { Text } from 'react-native';

import {
  useRouter,
  useGlobalSearchParams,
  router,
  useLocalSearchParams,
  Redirect,
  Slot,
  usePathname,
} from '../exports';
import { Stack } from '../layouts/Stack';
import { Tabs } from '../layouts/Tabs';
import { act, fireEvent, renderRouter, screen } from '../testing-library';

describe('hooks only', () => {
  it('can handle navigation between routes', async () => {
    renderRouter({
      index: function MyIndexRoute() {
        const router = useRouter();

        return (
          <Text testID="index" onPress={() => router.push('/profile/test-name')}>
            Press me
          </Text>
        );
      },
      '/profile/[name]': function MyRoute() {
        const { name } = useGlobalSearchParams();
        return <Text>{name}</Text>;
      },
    });

    const text = await screen.findByTestId('index');

    act(() => {
      fireEvent.press(text);
    });

    expect(await screen.findByText('test-name')).toBeOnTheScreen();
    expect(screen).toHavePathname('/profile/test-name');
  });
});

describe('imperative only', () => {
  it('will throw if navigation is attempted before navigation is ready', async () => {
    renderRouter(
      {
        index: function MyIndexRoute() {
          return <Text>Press me</Text>;
        },
        '/profile/[name]': function MyRoute() {
          const { name } = useGlobalSearchParams();
          return <Text>{name}</Text>;
        },
      },
      {
        initialUrl: new Promise(() => {}), // This never resolves
      }
    );

    expect(() => {
      act(() => {
        router.push('/profile/test-name');
      });
    }).toThrowError(
      'Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.'
    );
  });

  it('can handle navigation between routes', async () => {
    renderRouter({
      index: function MyIndexRoute() {
        return <Text testID="index">Press me</Text>;
      },
      '/profile/[name]': function MyRoute() {
        const { name } = useGlobalSearchParams();
        return <Text>{name}</Text>;
      },
    });

    await screen.findByTestId('index');

    act(() => {
      router.push('/profile/test-name');
    });

    expect(await screen.findByText('test-name')).toBeOnTheScreen();
  });
  it('can handle navigation between routes with hashes', async () => {
    renderRouter({
      index: function MyIndexRoute() {
        return <Text testID="index">Press me</Text>;
      },
      '/profile/[name]': function MyRoute() {
        const { name } = useGlobalSearchParams();
        return <Text>{name}</Text>;
      },
    });

    await screen.findByTestId('index');

    act(() => {
      router.push('/profile/test-name?foo=bar#baz');
    });

    expect(await screen.findByText('test-name')).toBeOnTheScreen();
  });
});

describe('mixed navigation', () => {
  it('can handle mixed navigation between routes', async () => {
    renderRouter({
      index: function MyIndexRoute() {
        const router = useRouter();

        return (
          <Text testID="index" onPress={() => router.push('/profile/test-name')}>
            Press me
          </Text>
        );
      },
      '/profile/[name]': function MyRoute() {
        const { name } = useGlobalSearchParams();
        return <Text>{name}</Text>;
      },
    });

    const text = await screen.findByTestId('index');

    act(() => {
      fireEvent.press(text);
    });

    expect(await screen.findByText('test-name')).toBeOnTheScreen();

    act(() => {
      router.push('/profile/another-test-name');
    });

    expect(await screen.findByText('another-test-name')).toBeOnTheScreen();
  });
});

it('preserves history when replacing screens within the same navigator', () => {
  /* Modified repro of [#221](https://github.com/expo/router/issues/221). */

  renderRouter({
    index: () => <Text>home</Text>,
    two: () => <Text>two</Text>,
    permissions: () => <Text>permissions</Text>,
    protected: function Protected() {
      const params = useLocalSearchParams();

      if (!params.permissions) {
        return <Redirect href="/permissions" />;
      }

      return <Text>protected</Text>;
    },
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/two'));
  expect(screen).toHavePathname('/two');

  act(() => router.push('/protected'));
  // /protected should have a redirect that replaces the pathname
  expect(screen).toHavePathname('/permissions');

  act(() => router.back());
  expect(screen).toHavePathname('/two');

  // Can also replace via the imperative API
  act(() => router.replace('/permissions'));
  expect(screen).toHavePathname('/permissions');

  act(() => router.back());
  expect(screen).toHavePathname('/');
});

it('replaces from top level modal to initial route in a tab navigator', () => {
  /* Modified repro of [#221](https://github.com/expo/router/issues/221). */

  renderRouter({
    _layout: {
      unstable_settings: {
        // Ensure that reloading on `/modal` keeps a back button present.
        initialRouteName: '(tabs)',
      },
      default: () => <Stack />,
    },
    '[...missing]': () => <Text testID="missing">missing</Text>,
    '(tabs)/_layout': () => <Tabs />,
    '(tabs)/index': () => <Text testID="two">two</Text>,
  });

  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments(['(tabs)']);

  act(() => router.push('/missing-screen'));
  expect(screen).toHavePathname('/missing-screen');
  expect(screen).toHaveSegments(['[...missing]']);
  expect(screen.getByTestId('missing')).toBeOnTheScreen();

  act(() => router.push('/'));
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments(['(tabs)']);
  expect(screen.getByTestId('two')).toBeOnTheScreen();

  // Ensure it also works for replace
  act(() => router.push('/missing-screen'));
  expect(screen).toHavePathname('/missing-screen');
  expect(screen).toHaveSegments(['[...missing]']);
  expect(screen.getByTestId('missing')).toBeOnTheScreen();

  act(() => router.replace('/'));
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments(['(tabs)']);
  expect(screen.getByTestId('two')).toBeOnTheScreen();
});

it('pushes auto-encoded params and fully qualified URLs', () => {
  /** https://github.com/expo/router/issues/345 */
  renderRouter({
    index: () => <Text />,
    '[id]': () => <Text />,
  });

  expect(screen).toHavePathname('/');

  act(() =>
    router.push({
      pathname: '/abc',
      params: {
        one: 'hello?',
        two: 'https://localhost:8081/?foo=bar&one=more',
        three: ['one', 'two', 'three'],
      },
    })
  );
  expect(screen).toHavePathname('/abc');
  expect(screen).toHaveSearchParams({
    id: 'abc',
    one: 'hello?',
    two: 'https://localhost:8081/?foo=bar&one=more',
    three: 'one,two,three',
  });
});

it('does not loop infinitely when pushing a screen with empty options to an invalid initial route name', () => {
  /** https://github.com/expo/router/issues/452 */

  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text />,
    'main/_layout': {
      unstable_settings: {
        // NOTE(EvanBacon): This has to be an invalid route.
        initialRouteName: 'index',
      },
      default: () => <Stack />,
    },
    'main/welcome': () => (
      <>
        <Stack.Screen options={{}} />
        <Text />
      </>
    ),
  });

  expect(screen).toHavePathname('/');
  act(() => router.push('/main/welcome'));
  expect(screen).toHavePathname('/main/welcome');
});

it('can push nested initial route name', () => {
  renderRouter({
    _layout: {
      unstable_settings: {
        // Should be able to push another stack even when this is set.
        initialRouteName: 'index',
      },
      default: () => <Stack />,
    },
    index: () => <Text />,
    'settings/_layout': () => <Slot />,
    'settings/index': () => <Text />,
  });

  expect(screen).toHavePathname('/');
  act(() => router.push('/settings'));
  expect(screen).toHavePathname('/settings');
});

it('can replace nested initial route name', () => {
  renderRouter({
    _layout: {
      unstable_settings: {
        // Should be able to push another stack even when this is set.
        initialRouteName: 'index',
      },
      default: () => <Stack />,
    },
    index: () => <Text />,
    'settings/_layout': () => <Slot />,
    'settings/index': () => <Text />,
  });

  expect(screen).toHavePathname('/');
  act(() => router.replace('/settings'));
  expect(screen).toHavePathname('/settings');
});

it('can check goBack before navigation mounts', () => {
  renderRouter({
    _layout: {
      default() {
        // No navigator mounted at the root, this should prevent navigation from working.
        return <></>;
      },
    },
    index: () => <Text />,
  });

  expect(screen).toHavePathname('/');

  // NOTE: This also tests that `canGoBack` does not throw.
  expect(router.canGoBack()).toBe(false);
});

it('can push back from a nested modal to a nested sibling', async () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="slot" />
        <Stack.Screen name="(group)" options={{ presentation: 'modal' }} />
      </Stack>
    ),

    index: () => <Text />,

    'slot/_layout': () => <Slot />,
    'slot/index': () => <Text />,

    '(group)/_layout': () => <Slot />,
    '(group)/modal': () => <Text />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');

  act(() => router.push('/(group)/modal'));
  expect(screen).toHavePathname('/modal');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');
});

it('can pop back from a nested modal to a nested sibling', async () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="slot" />
        <Stack.Screen name="(group)" options={{ presentation: 'modal' }} />
      </Stack>
    ),

    index: () => <Text />,

    'slot/_layout': () => <Slot />,
    'slot/index': () => <Text />,

    '(group)/_layout': () => <Slot />,
    '(group)/modal': () => <Text />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');

  act(() => router.push('/(group)/modal'));
  expect(screen).toHavePathname('/modal');

  act(() => router.back());
  expect(screen).toHavePathname('/slot');
});

it('can navigate to hoisted groups', () => {
  /** https://github.com/expo/router/issues/805 */

  renderRouter({
    index: () => <></>,
    _layout: () => <Slot />,
    'example/(a,b)/_layout': () => <Slot />,
    'example/(a,b)/route': () => <Text testID="route" />,
  });

  expect(screen).toHavePathname('/');
  act(() => router.push('/example/(a)/route'));

  expect(screen).toHavePathname('/example/route');
  expect(screen.getByTestId('route')).toBeTruthy();
});

it('can navigate to nested groups', () => {
  renderRouter({
    index: () => <></>,
    _layout: () => <Slot />,
    'example/(a,b)/_layout': () => <Slot />,
    'example/(a,b)/folder/(c,d)/_layout': () => <Slot />,
    'example/(a,b)/folder/(c,d)/route': () => <Text testID="route" />,
  });

  expect(screen).toHavePathname('/');
  act(() => router.push('/example/(a)/folder/(d)/route'));

  expect(screen).toHavePathname('/example/folder/route');
  expect(screen.getByTestId('route')).toBeTruthy();
});

it('can navigate to hoisted groups', () => {
  /** https://github.com/expo/router/issues/805 */

  renderRouter({
    index: () => <></>,
    _layout: () => <Slot />,
    'example/(a,b)/_layout': () => <Slot />,
    'example/(a,b)/route': () => <Text testID="route" />,
  });

  expect(screen).toHavePathname('/');
  act(() => router.push('/example/(a)/route'));

  expect(screen).toHavePathname('/example/route');
  expect(screen.getByTestId('route')).toBeTruthy();
});

it('can navigate to nested groups', () => {
  renderRouter({
    index: () => <></>,
    _layout: () => <Slot />,
    'example/(a,b)/_layout': () => <Slot />,
    'example/(a,b)/folder/(c,d)/_layout': () => <Slot />,
    'example/(a,b)/folder/(c,d)/route': () => <Text testID="route" />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/example/(a)/folder/(d)/route'));

  expect(screen).toHavePathname('/example/folder/route');
  expect(screen.getByTestId('route')).toBeTruthy();
});

it('can check goBack before navigation mounts', () => {
  renderRouter({
    _layout: {
      default() {
        // No navigator mounted at the root, this should prevent navigation from working.
        return <></>;
      },
    },
    index: () => <Text />,
  });

  expect(screen).toHavePathname('/');

  // NOTE: This also tests that `canGoBack` does not throw.
  expect(router.canGoBack()).toBe(false);
});

it('can navigate back from a nested modal to a nested sibling', async () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="slot" />
        <Stack.Screen name="(group)" options={{ presentation: 'modal' }} />
      </Stack>
    ),

    index: () => <Text />,

    'slot/_layout': () => <Slot />,
    'slot/index': () => <Text />,

    '(group)/_layout': () => <Slot />,
    '(group)/modal': () => <Text />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');

  act(() => router.push('/(group)/modal'));
  expect(screen).toHavePathname('/modal');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');

  // Ensure it also works fo replace

  act(() => router.push('/(group)/modal'));
  expect(screen).toHavePathname('/modal');

  act(() => router.replace('/slot'));
  expect(screen).toHavePathname('/slot');
});

it('can pop back from a nested modal to a nested sibling', async () => {
  renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Screen name="index" />
        <Stack.Screen name="slot" />
        <Stack.Screen name="(group)" options={{ presentation: 'modal' }} />
      </Stack>
    ),

    index: () => <Text />,

    'slot/_layout': () => <Slot />,
    'slot/index': () => <Text />,

    '(group)/_layout': () => <Slot />,
    '(group)/modal': () => <Text />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/slot'));
  expect(screen).toHavePathname('/slot');

  act(() => router.push('/(group)/modal'));
  expect(screen).toHavePathname('/modal');

  act(() => router.back());
  expect(screen).toHavePathname('/slot');
});

it('supports multi-level 404s', async () => {
  renderRouter({
    index: () => <Text>found</Text>,
    '+not-found': () => <Text>404</Text>,
  });

  expect(screen).toHavePathname('/');
  expect(await screen.findByText('found')).toBeOnTheScreen();

  act(() => router.push('/123'));
  expect(await screen.findByText('404')).toBeOnTheScreen();

  act(() => router.push('/123/456'));
  expect(await screen.findByText('404')).toBeOnTheScreen();
});

it('supports dynamic 404s next to dynamic routes', async () => {
  renderRouter({
    index: () => <Text />,
    '[slug]': () => <Text>found</Text>,
    '+not-found': () => <Text>404</Text>,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/123'));
  expect(screen).toHavePathname('/123');
  expect(await screen.findByText('found')).toBeOnTheScreen();
});

it('supports deep dynamic 404s next to dynamic routes', async () => {
  renderRouter({
    index: () => <Text />,
    '+not-found': () => <Text>404</Text>,
    '[...slug]': () => <Text>found</Text>,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/123'));
  expect(screen).toHavePathname('/123');
  expect(await screen.findByText('found')).toBeOnTheScreen();
});

it('can deep link, pop back, and move around with initialRouteName in root layout', async () => {
  renderRouter(
    {
      _layout: {
        unstable_settings: {
          initialRouteName: 'index',
        },
        default: () => (
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Screen name="a" />
          </Stack>
        ),
      },
      index: () => <Text />,
      'a/_layout': () => <Stack />,
      'a/b/index': () => <Text />,
    },
    {
      initialUrl: '/a/b',
    }
  );
  expect(screen).toHavePathname('/a/b');
  act(() => router.back());
  expect(screen).toHavePathname('/');

  act(() => router.push('/a/b'));
  expect(screen).toHavePathname('/a/b');
});

jest.mock('expo-constants', () => ({
  __esModule: true,
  ExecutionEnvironment: jest.requireActual('expo-constants').ExecutionEnvironment,
  default: {
    expoConfig: {},
  },
}));

afterEach(() => {
  Constants.expoConfig!.experiments = undefined;
});

it('respects basePath', async () => {
  // @ts-expect-error
  Constants.expoConfig = {
    experiments: {
      basePath: '/one/two',
    },
  };

  renderRouter({
    index: function Index() {
      const pathname = usePathname();
      return <Text testID="rendered-path">{pathname}</Text>;
    },
  });

  expect(screen).toHavePathname('/');

  const text = await screen.findByTestId('rendered-path');

  expect(text).toHaveTextContent('/');
});

it('can redirect within a group layout', () => {
  renderRouter({
    '(group)/_layout': function Component() {
      const pathname = usePathname();

      if (pathname === '/') {
        return <Redirect href="/page" />;
      }

      return <Stack />;
    },
    '(group)/index': () => <Text testID="index" />,
    '(group)/page': () => <Text testID="page" />,
  });

  expect(screen).toHavePathname('/page');
  expect(screen.getByTestId('page')).toBeOnTheScreen();
});

it('can replace across groups', async () => {
  renderRouter({
    _layout: () => <Tabs />,
    'one/_layout': () => <Stack />,
    'one/screen': () => <Text testID="one/screen" />,
    'two/_layout': () => <Stack />,
    'two/screen': () => <Text testID="two/screen" />,
  });

  expect(screen).toHavePathname('/');

  act(() => router.push('/two/screen'));
  expect(screen).toHavePathname('/two/screen');
  expect(screen.getByTestId('two/screen')).toBeOnTheScreen();

  act(() => router.push('/one/screen'));
  expect(screen).toHavePathname('/one/screen');
  expect(screen.getByTestId('one/screen')).toBeOnTheScreen();

  // Should replace at the top Tabs
  act(() => router.replace('/two/screen'));
  expect(screen).toHavePathname('/two/screen');
  expect(screen.getByTestId('two/screen')).toBeOnTheScreen();

  act(() => router.back());

  act(() => router.push('/one/screen'));
  expect(screen).toHavePathname('/one/screen');
  expect(screen.getByTestId('one/screen')).toBeOnTheScreen();

  expect(router.canGoBack()).toBe(false);
});

it('can push nested stacks without creating circular references', async () => {
  renderRouter({
    _layout: () => <Stack />,
    index: () => <Text />,
    'menu/_layout': () => <Stack />,
    'menu/[id]': () => <Text />,
    'menu/index': () => <Text />,
  });
  expect(screen).toHavePathname('/');
  act(() => router.push('/menu'));
  act(() => router.push('/menu/123'));
  expect(screen).toHavePathname('/menu/123');
});

it('can push nested stacks with initial route names without creating circular references', async () => {
  renderRouter({
    _layout: { initialRouteName: 'index', default: () => <Stack /> },
    index: () => <Text />,
    'menu/_layout': { initialRouteName: 'index', default: () => <Stack /> },
    'menu/[id]': () => <Text />,
    'menu/index': () => <Text />,
  });
  expect(screen).toHavePathname('/');
  act(() => router.push('/menu'));
  act(() => router.push('/menu/123'));
  expect(screen).toHavePathname('/menu/123');
});

it('can push & replace with nested Slots', async () => {
  renderRouter({
    _layout: () => <Slot />,
    index: () => <Text testID="index" />,
    'one/_layout': () => <Slot />,
    'one/index': () => <Text testID="one" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Push

  act(() => router.push('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.push('/'));
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();

  // Replace

  act(() => router.replace('/one'));
  expect(screen).toHavePathname('/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.replace('/'));
  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('index')).toBeOnTheScreen();
});

it('can push relative links from index routes', async () => {
  renderRouter({
    _layout: () => <Slot />,
    '(app)/index': () => <Text testID="one" />,
    '(app)/test/_layout': () => <Stack />,
    '(app)/test/index': () => <Text testID="two" />,
    '(app)/test/bar': () => <Text testID="three" />,
  });

  expect(screen).toHavePathname('/');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.push('./test'));
  expect(screen).toHavePathname('/test');
  expect(screen.getByTestId('two')).toBeOnTheScreen();

  act(() => router.push('./bar'));
  // expect(screen.getByTestId('three')).toBeOnTheScreen();
  // expect(screen).toHavePathname('/test/bar');
});

it('can navigation to a relative route without losing path params', async () => {
  renderRouter(
    {
      _layout: () => <Slot />,
      '(group)/[value]/one': () => <Text testID="one" />,
      '(group)/[value]/two': () => <Text testID="two" />,
      '(group)/[...value]/three': () => <Text testID="three" />,
      '(group)/[...value]/four': () => <Text testID="four" />,
    },
    {
      initialUrl: '/test/one',
    }
  );

  expect(screen).toHavePathname('/test/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.push('./two'));
  expect(screen).toHavePathname('/test/two');
  expect(screen.getByTestId('two')).toBeOnTheScreen();

  act(() => router.push('../apple/one?orange=1'));
  expect(screen).toHavePathname('/apple/one');
  expect(screen.getByTestId('one')).toBeOnTheScreen();

  act(() => router.push('./two'));
  expect(screen).toHavePathname('/apple/two');
  expect(screen.getByTestId('two')).toBeOnTheScreen();

  act(() => router.push('./three'));
  expect(screen).toHavePathname('/apple/three');
  expect(screen.getByTestId('three')).toBeOnTheScreen();

  act(() => router.push('./banana/four'));
  expect(screen).toHavePathname('/apple/banana/four');
  expect(screen.getByTestId('four')).toBeOnTheScreen();

  act(() => router.push('./three'));
  expect(screen).toHavePathname('/apple/banana/three');
  expect(screen.getByTestId('three')).toBeOnTheScreen();
});

describe('shared routes with tabs', () => {
  function renderSharedTabs() {
    renderRouter({
      '(one,two)/_layout': () => <Stack />,
      '(one,two)/one': () => <Text />,
      '(one,two)/post': () => <Text />,
      '(two)/two': () => <Text />,
      _layout: () => <Tabs />,
      index: () => <Redirect href="/one" />,
    });

    expect(screen).toHavePathname('/one');
  }

  describe('tab one (default)', () => {
    it('pushes post in tab one using absolute /post', async () => {
      renderSharedTabs();
      act(() => router.push('/post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(one)', 'post']);
    });
    it('pushes post in tab one using absolute /(tabs)/(one)/post', async () => {
      renderSharedTabs();
      act(() => router.push('/(one)/post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(one)', 'post']);
    });
    it('pushes post in tab one using relative ./post', async () => {
      renderSharedTabs();
      act(() => router.push('./post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(one)', 'post']);
    });
  });
  describe('tab two', () => {
    // Navigate to tab two before each case here.
    beforeEach(() => {
      renderSharedTabs();
      act(() => router.push('/two'));
      expect(screen).toHavePathname('/two');
      expect(screen).toHaveSegments(['(two)', 'two']);
    });

    it('pushes post in tab two with absolute `/post` goes to default tab', async () => {
      act(() => router.push('/post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(one)', 'post']);
    });
    it('pushes post in tab two using absolute /(tabs)/(two)/post', async () => {
      act(() => router.push('/(two)/post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(two)', 'post']);
    });
    it('pushes post in tab two using relative ./post', async () => {
      // Pushing `./post` should preserve the relative position in tab two and NOT swap to the default tab one variation of the `/post` route.
      act(() => router.push('./post'));
      expect(screen).toHavePathname('/post');
      expect(screen).toHaveSegments(['(two)', 'post']);
    });
  });
});
