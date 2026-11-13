import { act, fireEvent, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, use, useState } from 'react';
import { Text } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import JSStack from '../layouts/JSStack';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { StackRouter } from '../react-navigation/native';
import { createStandardRouterNavigator, type NavigatorContentProps } from '../standard-navigation';
import { renderRouter } from '../testing-library';

it('redirects a guarded route to the anchor default during the initial load', async () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  await renderRouter(
    {
      _layout: function Layout() {
        useStateResult = useState(false);
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={useStateResult[0]}>
              <Stack.Screen name="a" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => {
        return <Text testID="index">index</Text>;
      },
      a: () => <Text testID="a">a</Text>,
      b: () => <Text testID="b">B</Text>,
      c: () => <Text testID="c">C</Text>,
    },
    { initialUrl: '/a' }
  );

  // Guarded /a is unreachable during initial load: index is shown at /.
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // Enable the /a route
  await act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  await act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');
  expect(navigationRef.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'a',
    'index',
    'b',
    'c',
  ]);
});

it('redirects nested guarded routes to the anchor and unlocks them as guards flip', async () => {
  let useStateResultA: [boolean, Dispatch<SetStateAction<boolean>>];
  let useStateResultB: [boolean, Dispatch<SetStateAction<boolean>>];
  let useStateResultC: [boolean, Dispatch<SetStateAction<boolean>>];

  await renderRouter({
    _layout: function Layout() {
      useStateResultA = useState(false);
      useStateResultB = useState(false);
      useStateResultC = useState(false);

      return (
        <Stack id={undefined}>
          <Stack.Protected guard={useStateResultA[0]}>
            <Stack.Screen name="a" />

            <Stack.Protected guard={useStateResultB[0]}>
              <Stack.Screen name="b" />

              <Stack.Protected guard={useStateResultC[0]}>
                <Stack.Screen name="c" />
              </Stack.Protected>
            </Stack.Protected>
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => {
      return <Text testID="index">index</Text>;
    },
    a: () => <Text testID="a">a</Text>,
    b: () => <Text testID="b">B</Text>,
    c: () => <Text testID="c">C</Text>,
  });

  // try to navigate to all protected routes should not change the current
  // route since all the guards are false
  await act(() => router.replace('/a'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  await act(() => router.replace('/b'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  await act(() => router.replace('/c'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // change the guards for routes A and C to true: should make A available but
  // not C as it is nested under B and the guard for B is still false
  await act(() => {
    useStateResultA[1](true);
    useStateResultC[1](true);
  });

  await act(() => router.replace('/a'));
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

  await act(() => router.replace('/b'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  await act(() => router.replace('/c'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // change the guard for route B to true: should make B available and also C
  // should be available now as all its parents guards are true
  await act(() => {
    useStateResultB[1](true);
  });

  await act(() => router.replace('/a'));
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

  await act(() => router.replace('/b'));
  expect(screen.getByTestId('b')).toBeVisible();
  expect(screen).toHavePathname('/b');

  await act(() => router.replace('/c'));
  expect(screen.getByTestId('c')).toBeVisible();
  expect(screen).toHavePathname('/c');

  expect(navigationRef.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'a',
    'b',
    'c',
    'index',
  ]);
});

it('defaults a guarded route to the navigator anchor', async () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  await renderRouter(
    {
      _layout: {
        unstable_settings: {
          anchor: 'b',
        },
        default: function Layout() {
          useStateResult = useState(false);
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={useStateResult[0]}>
                <Stack.Screen name="a" />
              </Stack.Protected>

              <Stack.Screen name="b" />
            </Stack>
          );
        },
      },
      index: () => {
        return <Text testID="index">index</Text>;
      },
      a: () => <Text testID="a">a</Text>,
      b: () => <Text testID="b">B</Text>,
    },
    { initialUrl: '/a' }
  );

  // Guarded /a is unreachable; the anchor route b is shown instead.
  expect(screen.getByTestId('b')).toBeVisible();
  expect(screen).toHavePathname('/b');

  // Enable the /a route
  await act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  await act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');
  expect(navigationRef.getRootState().routes[0]!.state!.routeNames).toStrictEqual([
    'a',
    'b',
    'index',
  ]);
});

it('redirects a guarded route to an explicit redirectTo target', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/login">
              <Stack.Screen name="secret" />
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('redirects a guarded route in a nested navigator to that navigator anchor', async () => {
  await renderRouter(
    {
      _layout: () => <Stack id={undefined} />,
      index: () => <Text testID="index">index</Text>,
      'nested/_layout': {
        unstable_settings: { anchor: 'home' },
        default: function NestedLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
              <Stack.Screen name="home" />
            </Stack>
          );
        },
      },
      'nested/home': () => <Text testID="home">home</Text>,
      'nested/secret': () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/nested/secret' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/nested/home');
});

it('uses the outer guard redirectTo when both nested guards fail', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/login">
              <Stack.Protected guard={false} redirectTo="/upgrade">
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="login" />
            <Stack.Screen name="upgrade" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      upgrade: () => <Text testID="upgrade">upgrade</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('ignores the inner guard redirectTo when the failing outer guard has no redirectTo', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false}>
              <Stack.Protected guard={false} redirectTo="/upgrade">
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="upgrade" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      upgrade: () => <Text testID="upgrade">upgrade</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('uses the outer guard redirectTo when the failing inner guard has no redirectTo', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/login">
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('uses the inner guard redirectTo when only the inner guard fails', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard redirectTo="/outer">
              <Stack.Protected guard={false} redirectTo="/inner">
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="outer" />
            <Stack.Screen name="inner" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      outer: () => <Text testID="outer">outer</Text>,
      inner: () => <Text testID="inner">inner</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('inner')).toBeVisible();
  expect(screen).toHavePathname('/inner');
});

it('applies the parent guard redirectTo to a route nested in a passing child guard', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/login">
              <Stack.Protected guard>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('does not apply the parent guard redirectTo to a route nested in a passing child guard when parent guard is true', async () => {
  await renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard redirectTo="/login">
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('should move away from a focused route when its guard flips false', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [guard, setState] = useState(true);
        setGuard = setState;
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={guard}>
              <Stack.Screen name="secret" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  await act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('should remove guarded routes from history when a guard flips false', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack id={undefined}>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="secret" />
          </Stack.Protected>
          <Stack.Screen name="other" />
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    other: () => <Text testID="other">other</Text>,
  });

  await act(() => router.push('/secret'));
  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  await act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  await act(() => {
    setGuard(false);
  });

  await act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('should remove guarded routes from JavaScript stack history when a guard flips false', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <JSStack>
          <JSStack.Protected guard={guard}>
            <JSStack.Screen name="secret" />
          </JSStack.Protected>
          <JSStack.Screen name="other" />
        </JSStack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    other: () => <Text testID="other">other</Text>,
  });

  await act(() => router.push('/secret'));
  await act(() => router.push('/other'));
  await act(() => setGuard(false));
  await act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('should not restore pruned guarded history when a guard flips true->false->true', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack id={undefined}>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="secret" />
          </Stack.Protected>
          <Stack.Screen name="other" />
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    other: () => <Text testID="other">other</Text>,
  });

  await act(() => router.push('/secret'));
  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  await act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  // Revoke access: the guarded /secret history entry is pruned.
  await act(() => {
    setGuard(false);
  });

  // Re-grant access while still on /other.
  await act(() => {
    setGuard(true);
  });

  // Flipping the guard back to true must not resurrect the pruned /secret entry.
  await act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('should use the anchor when a focused route guard flips false', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: {
        unstable_settings: {
          anchor: 'home',
        },
        default: function Layout() {
          const [guard, setState] = useState(true);
          setGuard = setState;
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={guard}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
              <Stack.Screen name="home" />
            </Stack>
          );
        },
      },
      index: () => <Text testID="index">index</Text>,
      home: () => <Text testID="home">home</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/secret' }
  );

  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  await act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/home');
});

it('will wait for React state updates before pushing', async () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  await renderRouter({
    _layout: function Layout() {
      const [value, setState] = useState(false);

      return (
        <SetterContext value={setState}>
          <Stack>
            <Stack.Protected guard={value}>
              <Stack.Screen name="protected" />
            </Stack.Protected>
          </Stack>
        </SetterContext>
      );
    },
    index: function Index() {
      const setState = use(SetterContext);

      return (
        <Text
          testID="index"
          onPress={() => {
            setState(true);
            router.push('/protected');
          }}>
          Index
        </Text>
      );
    },
    protected: function Nested() {
      return <Text testID="protected">Protected</Text>;
    },
  });

  await fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/protected');
});

it('works with tabs', async () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  await renderRouter({
    _layout: function Layout() {
      const [value, setState] = useState(false);

      return (
        <SetterContext value={setState}>
          <Tabs>
            <Tabs.Screen name="index" />

            <Tabs.Protected guard={value}>
              <Tabs.Screen name="protected" />
            </Tabs.Protected>
          </Tabs>
        </SetterContext>
      );
    },
    index: function Index() {
      const setState = use(SetterContext);

      return (
        <Text
          testID="index"
          onPress={() => {
            router.push('/protected');
          }}
          onLongPress={() => {
            setState(true);
            router.push('/protected');
          }}>
          Index
        </Text>
      );
    },
    protected: function Nested() {
      return <Text testID="protected">Protected</Text>;
    },
  });

  expect(screen.queryByLabelText('protected, tab, 2 of 2')).toBeNull();

  await fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/');

  await fireEvent(screen.getByTestId('index'), 'longPress');

  expect(screen).toHavePathname('/protected');
  expect(screen.queryByLabelText('protected, tab, 2 of 2')).toBeVisible();
});

it('replaces a guarded group with the root index when they share a URL', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="index" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="login">Login</Text>,
      '(app)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="(home)" />
        </Tabs>
      ),
      '(app)/(home)/_layout': () => <Stack />,
      '(app)/(home)/index': () => <Text testID="home">Home</Text>,
    },
    { initialUrl: '/(app)/(home)' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  await act(() => setSignedIn(false));
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
});

it('opens the root index on a cold start at a guarded group that shares its URL', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Screen name="index" />
        </Stack>
      ),
      '(app)/_layout': () => (
        <Tabs>
          <Tabs.Screen name="(home)" />
        </Tabs>
      ),
      '(app)/(home)/_layout': () => <Stack />,
      '(app)/(home)/index': () => <Text testID="home">Home</Text>,
      index: () => <Text testID="login">Login</Text>,
    },
    { initialUrl: '/(app)/(home)' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen.queryByTestId('home')).toBeNull();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
});

it('replaces a fully guarded nested navigator with the parent fallback when they share a URL', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'index' },
        default: () => <Stack />,
      },
      index: () => <Text testID="login">Login</Text>,
      '(app)/_layout': function AppLayout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="index" />
            </Stack.Protected>
          </Stack>
        );
      },
      '(app)/index': () => <Text testID="home">Home</Text>,
    },
    { initialUrl: '/(app)' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  await act(() => setSignedIn(false));
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen.queryByTestId('home')).toBeNull();
  expect(screen).toHavePathname('/');
  expect(screen).toHaveSegments([]);
});

it('removes a blocked focused route and focuses the last accessible route with its state', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));
  const settingsKey = navigationRef.getRootState().routes[0]!.state!.routes[1]!.key;

  await act(() => setGuard(false));

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
  const state = navigationRef.getRootState().routes[0]!.state!;
  expect(state.routes.map((route) => route.name)).toEqual(['index', 'settings']);
  expect(state.routes[1]!.key).toBe(settingsKey);
});

it('replaces a blocked focused route with the fallback in a custom stack navigator', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;
  const CustomStack = createStandardRouterNavigator(
    ({ state, descriptors }: NavigatorContentProps<object>) =>
      descriptors[state.routes[state.index]!.key]!.render(),
    StackRouter
  );

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <CustomStack>
          <CustomStack.Protected guard={guard}>
            <CustomStack.Screen name="login" />
          </CustomStack.Protected>
        </CustomStack>
      );
    },
    index: () => <Text testID="home">home</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/login'));
  expect(screen.getByTestId('login')).toBeVisible();

  await act(() => setGuard(false));

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('replaces every blocked route with the fallback in one state change when no route survives', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={!signedIn}>
              <Stack.Screen name="login" />
              <Stack.Screen name="reset" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="home">home</Text>,
      login: () => <Text testID="login">login</Text>,
      reset: () => <Text testID="reset">reset</Text>,
    },
    { initialUrl: '/login' }
  );

  await act(() => router.push('/reset'));
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'login',
    'reset',
  ]);

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => setSignedIn(true));
  } finally {
    unsubscribe();
  }

  // A hidden `login` state between the removal and the replace would render an empty screen.
  expect(committedRouteNames).toEqual([['index']]);
  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('keeps a blocked focused route with redirectTo and redirects it', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack>
          <Stack.Protected guard={guard} redirectTo="/">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));

  await act(() => setGuard(false));

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/');
  const state = navigationRef.getRootState().routes[0]!.state!;
  expect(state.routes.map((route) => route.name)).toEqual(['index', 'settings', 'index']);
  expect(state.routes[2]!.key).not.toBe(state.routes[0]!.key);
});

it('adds no screens when the guards change repeatedly', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [signedIn, setState] = useState(false);
      setSignedIn = setState;
      return (
        <Stack>
          <Stack.Protected guard={signedIn}>
            <Stack.Screen name="profile" />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="home">home</Text>,
    profile: () => <Text testID="profile">profile</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/login'));
  await act(() => setSignedIn(true));
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);

  await act(() => router.push('/profile'));
  await act(() => setSignedIn(false));
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);

  await act(() => router.push('/login'));
  await act(() => setSignedIn(true));
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);
  expect(screen.getByTestId('home')).toBeVisible();
  expect(router.canGoBack()).toBe(false);
});

describe('all routes guarded', () => {
  let consoleWarnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('renders nothing without crashing when every route is guarded from the start', async () => {
    await renderRouter({
      _layout: function Layout() {
        return (
          <>
            <Text testID="layout">layout</Text>
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
                <Stack.Screen name="second" />
              </Stack.Protected>
            </Stack>
          </>
        );
      },
      index: () => <Text testID="index">index</Text>,
      second: () => <Text testID="second">second</Text>,
    });

    expect(screen.getByTestId('layout')).toBeVisible();
    expect(screen.queryByTestId('index')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Expo Router shows an empty screen because every route in this navigator is protected. An app must not protect all routes. Make at least one route accessible, or set `redirectTo` on the `Protected` component. A future version of Expo Router can throw an error instead of showing an empty screen.'
    );
    // The navigator itself stays mounted (previously it rendered null when all
    // its routes were guarded).
    expect(JSON.stringify(screen.toJSON())).toContain('RNSScreenStack');
  });

  it('keeps only the first route when all guards flip false and shows it when they flip back to true', async () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;

    await renderRouter({
      _layout: function Layout() {
        const [guard, setState] = useState(true);
        setGuard = setState;
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={guard}>
              <Stack.Screen name="index" />
              <Stack.Screen name="second" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      second: () => <Text testID="second">second</Text>,
    });

    await act(() => router.push('/second'));
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen).toHavePathname('/second');

    const firstKeyBefore = navigationRef.getRootState().routes[0]!.state!.routes[0]!.key;

    // Guard everything: content hides but the navigator must stay mounted.
    await act(() => {
      setGuard(false);
    });

    expect(screen.queryByTestId('index')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Expo Router shows an empty screen because every route in this navigator is protected. An app must not protect all routes. Make at least one route accessible, or set `redirectTo` on the `Protected` component. A future version of Expo Router can throw an error instead of showing an empty screen.'
    );

    await act(() => {
      setGuard(true);
    });

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
    const stateAfter = navigationRef.getRootState().routes[0]!.state!;
    expect(stateAfter.routes).toHaveLength(1);
    expect(stateAfter.routes[0]!.key).toBe(firstKeyBefore);
  });

  it('redirects to the parent anchor when all nested guards flip false', async () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;

    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack id={undefined} />,
        },
        index: () => <Text testID="index">index</Text>,
        'nested/_layout': function NestedLayout() {
          const [guard, setState] = useState(true);
          setGuard = setState;
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={guard}>
                <Stack.Screen name="index" />
                <Stack.Screen name="second" />
              </Stack.Protected>
            </Stack>
          );
        },
        'nested/index': () => <Text testID="nested-index">nested index</Text>,
        'nested/second': () => <Text testID="second">second</Text>,
      },
      { initialUrl: '/nested/second' }
    );

    expect(screen.getByTestId('second')).toBeVisible();

    await act(() => setGuard(false));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
  });

  it('does not redirect when the parent anchor is the fully guarded navigator', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'nested' },
          default: () => <Stack id={undefined} />,
        },
        index: () => <Text testID="index">index</Text>,
        'nested/_layout': function NestedLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
              </Stack.Protected>
            </Stack>
          );
        },
        'nested/index': () => <Text testID="nested-index">nested index</Text>,
      },
      { initialUrl: '/nested' }
    );

    expect(screen.queryByTestId('nested-index')).toBeNull();
    expect(screen).toHavePathname('/nested');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Expo Router shows an empty screen because every route in this navigator is protected. An app must not protect all routes. Make at least one route accessible, or set `redirectTo` on the `Protected` component. A future version of Expo Router can throw an error instead of showing an empty screen.'
    );
  });

  it('skips a self-targeting parent anchor and redirects to the grandparent anchor', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'home' },
          default: () => <Stack id={undefined} />,
        },
        home: () => <Text testID="home">home</Text>,
        'nested/_layout': {
          unstable_settings: { anchor: 'deep' },
          default: () => <Stack id={undefined} />,
        },
        'nested/deep/_layout': function DeepLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
              </Stack.Protected>
            </Stack>
          );
        },
        'nested/deep/index': () => <Text testID="deep-index">deep index</Text>,
      },
      { initialUrl: '/nested/deep' }
    );

    expect(screen.getByTestId('home')).toBeVisible();
    expect(screen).toHavePathname('/home');
  });

  it('uses updated params from an object redirectTo', async () => {
    let setId: Dispatch<SetStateAction<string>>;

    await renderRouter({
      _layout: function Layout() {
        const [id, setState] = useState('one');
        setId = setState;
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo={{ pathname: '/login/[id]', params: { id } }}>
              <Stack.Screen name="secret" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      secret: () => <Text testID="secret">secret</Text>,
      'login/[id]': () => <Text testID="login">login</Text>,
    });

    await act(() => setId('two'));
    await act(() => router.push('/secret'));

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/login/two');
  });

  it('preserves a parent anchor whose name ends in index', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'reindex' },
          default: () => <Stack id={undefined} />,
        },
        reindex: () => <Text testID="reindex">reindex</Text>,
        'nested/_layout': function NestedLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
              </Stack.Protected>
            </Stack>
          );
        },
        'nested/index': () => <Text testID="nested-index">nested index</Text>,
      },
      { initialUrl: '/nested' }
    );

    expect(screen.getByTestId('reindex')).toBeVisible();
    expect(screen).toHavePathname('/reindex');
  });

  it('redirects out of a pathless group to the parent index', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack id={undefined} />,
        },
        index: () => <Text testID="index">index</Text>,
        '(app)/_layout': function AppLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack>
          );
        },
        '(app)/secret': () => <Text testID="secret">secret</Text>,
      },
      { initialUrl: '/secret' }
    );

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
  });

  it('redirects to the configured pathless group when groups share a URL', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: '(two)' },
          default: () => (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack>
          ),
        },
        '(one)/_layout': () => <Stack id={undefined} />,
        '(one)/index': () => <Text testID="one">one</Text>,
        '(two)/_layout': () => <Stack id={undefined} />,
        '(two)/index': () => <Text testID="two">two</Text>,
        secret: () => <Text testID="secret">secret</Text>,
      },
      { initialUrl: '/secret' }
    );

    expect(screen.getByTestId('two')).toBeVisible();
    expect(screen.queryByTestId('one')).toBeNull();
    expect(screen).toHavePathname('/');
  });

  it('preserves params in a dynamic parent anchor', async () => {
    await renderRouter(
      {
        _layout: () => <Stack id={undefined} />,
        '[id]/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => <Stack id={undefined} />,
        },
        '[id]/index': () => <Text testID="profile">profile</Text>,
        '[id]/nested/_layout': function NestedLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
              </Stack.Protected>
            </Stack>
          );
        },
        '[id]/nested/index': () => <Text testID="nested-index">nested index</Text>,
      },
      { initialUrl: '/alice/nested' }
    );

    expect(screen.getByTestId('profile')).toBeVisible();
    expect(screen).toHavePathname('/alice');
  });

  it('does not render guarded content when pushing directly to a route guarded with no destination', async () => {
    await renderRouter({
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false}>
              <Stack.Screen name="index" />
              <Stack.Screen name="second" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      second: () => <Text testID="second">second</Text>,
    });

    await act(() => router.push('/second'));

    expect(screen.queryByTestId('index')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
  });

  it('redirects out of a fully guarded nested navigator via redirectTo', async () => {
    await renderRouter(
      {
        _layout: () => <Stack id={undefined} />,
        index: () => <Text testID="index">index</Text>,
        login: () => <Text testID="login">login</Text>,
        'nested/_layout': function NestedLayout() {
          return (
            <Stack id={undefined}>
              <Stack.Protected guard={false} redirectTo="/login">
                <Stack.Screen name="secret" />
              </Stack.Protected>
            </Stack>
          );
        },
        'nested/secret': () => <Text testID="secret">secret</Text>,
      },
      { initialUrl: '/nested/secret' }
    );

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/login');
  });
});

describe('routes without /index suffix', () => {
  describe('Protected', () => {
    it('should protect dynamic routes without explicit /index suffix', async () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      await renderRouter(
        {
          _layout: function Layout() {
            useStateResult = useState(false);
            return (
              <Stack id={undefined}>
                <Stack.Protected guard={useStateResult[0]}>
                  <Stack.Screen name="otp/[flow]" />
                </Stack.Protected>
              </Stack>
            );
          },
          index: () => <Text testID="index">index</Text>,
          'otp/[flow]/index': () => <Text testID="otp">OTP</Text>,
        },
        { initialUrl: '/otp/signin' }
      );

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen).toHavePathname('/');

      await act(() => {
        useStateResult[1](true);
      });

      await act(() => router.replace('/otp/signin'));

      expect(screen.getByTestId('otp')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin');
    });

    it('should protect routes when _layout exists alongside index', async () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      await renderRouter(
        {
          _layout: function Layout() {
            useStateResult = useState(false);
            return (
              <Stack id={undefined}>
                <Stack.Protected guard={useStateResult[0]}>
                  <Stack.Screen name="otp/[flow]" />
                </Stack.Protected>
              </Stack>
            );
          },
          index: () => <Text testID="index">index</Text>,
          'otp/[flow]/_layout': () => <Stack />,
          'otp/[flow]/index': () => <Text testID="otp">OTP</Text>,
        },
        { initialUrl: '/otp/signin' }
      );

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen).toHavePathname('/');

      await act(() => {
        useStateResult[1](true);
      });

      await act(() => router.replace('/otp/signin'));

      expect(screen.getByTestId('otp')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin');
    });

    it('should protect routes when _layout exists without index', async () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      await renderRouter(
        {
          _layout: function Layout() {
            useStateResult = useState(false);
            return (
              <Stack id={undefined}>
                <Stack.Protected guard={useStateResult[0]}>
                  <Stack.Screen name="otp/[flow]" />
                </Stack.Protected>
              </Stack>
            );
          },
          index: () => <Text testID="index">index</Text>,
          'otp/[flow]/_layout': () => <Stack />,
          'otp/[flow]/step1': () => <Text testID="step1">Step 1</Text>,
        },
        { initialUrl: '/otp/signin/step1' }
      );

      expect(screen.getByTestId('index')).toBeVisible();
      expect(screen).toHavePathname('/');

      await act(() => {
        useStateResult[1](true);
      });

      await act(() => router.replace('/otp/signin/step1'));

      expect(screen.getByTestId('step1')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin/step1');
    });

    it('should throw when both name="otp/[flow]" and name="otp/[flow]/index" are used', async () => {
      await expect(
        async () =>
          await renderRouter(
            {
              _layout: function Layout() {
                const [guard] = useState(false);
                return (
                  <Stack id={undefined}>
                    <Stack.Protected guard={guard}>
                      <Stack.Screen name="otp/[flow]" />
                      <Stack.Screen name="otp/[flow]/index" />
                    </Stack.Protected>
                  </Stack>
                );
              },
              index: () => <Text testID="index">index</Text>,
              'otp/[flow]/index': () => <Text testID="otp">OTP</Text>,
            },
            { initialUrl: '/otp/signin' }
          )
      ).rejects.toThrow('Screen names must be unique');
    });
  });
});
