import { act, fireEvent, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { act as reactAct, createContext, use, useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { navigationRef } from '../global-state/navigationRef';
import { useIsNavigating } from '../global-state/useIsNavigating';
import { useLocalSearchParams } from '../hooks';
import { router } from '../imperative-api';
import JSStack from '../layouts/JSStack';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { ExperimentalStack } from '../layouts/experimental-stack';
import { StackActions, StackRouter } from '../react-navigation/routers';
import { createStandardRouterNavigator, type NavigatorContentProps } from '../standard-navigation';
import { renderRouter } from '../testing-library';
import { Navigator, Slot } from '../views/Navigator';
import { Protected } from '../views/Protected';
import { lazyModule } from './lazyModule';

describe('stack unmounted by a mount effect', () => {
  let consoleErrorSpy: jest.SpyInstance<void, Parameters<typeof console.error>>;
  let consoleWarnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('does not dispatch an unhandled removal when a mount effect replaces the stack', async () => {
    await renderRouter({
      _layout: function RootLayout() {
        const [loading, setLoading] = useState(false);
        useEffect(() => setLoading(true), []);
        if (loading) {
          return (
            <View testID="loading">
              <Text>Restoring account data</Text>
            </View>
          );
        }
        return (
          <Stack>
            <Stack.Screen name="index" />
            <Stack.Protected guard={false}>
              <Stack.Screen name="private" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text>Public</Text>,
      private: () => <Text>Private</Text>,
    });
    expect(screen.getByTestId('loading')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch an unhandled removal when a mount effect replaces the JS stack', async () => {
    await renderRouter({
      _layout: function RootLayout() {
        const [loading, setLoading] = useState(false);
        useEffect(() => setLoading(true), []);
        if (loading) {
          return (
            <View testID="loading">
              <Text>Restoring account data</Text>
            </View>
          );
        }
        return (
          <JSStack>
            <JSStack.Screen name="index" />
            <JSStack.Protected guard={false}>
              <JSStack.Screen name="private" />
            </JSStack.Protected>
          </JSStack>
        );
      },
      index: () => <Text>Public</Text>,
      private: () => <Text>Private</Text>,
    });
    expect(screen.getByTestId('loading')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });

  it('does not dispatch an unhandled removal when a mount effect replaces the experimental stack', async () => {
    await renderRouter({
      _layout: function RootLayout() {
        const [loading, setLoading] = useState(false);
        useEffect(() => setLoading(true), []);
        if (loading) {
          return (
            <View testID="loading">
              <Text>Restoring account data</Text>
            </View>
          );
        }
        return (
          <ExperimentalStack>
            <ExperimentalStack.Screen name="index" />
            <ExperimentalStack.Protected guard={false}>
              <ExperimentalStack.Screen name="private" />
            </ExperimentalStack.Protected>
          </ExperimentalStack>
        );
      },
      index: () => <Text>Public</Text>,
      private: () => <Text>Private</Text>,
    });
    expect(screen.getByTestId('loading')).toBeVisible();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
  });
});

it('settles a queued push and prunes guarded history when a guard flips in the stack', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <>
          <Text testID="is-navigating">{String(useIsNavigating())}</Text>
          <Stack>
            <Stack.Protected guard={guard}>
              <Stack.Screen name="secret" />
            </Stack.Protected>
            <Stack.Screen name="other" />
            <Stack.Screen name="third" />
          </Stack>
        </>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    other: () => <Text testID="other">other</Text>,
    third: () => <Text testID="third">third</Text>,
  });

  await act(() => router.push('/secret'));
  await act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();

  await act(() => {
    setGuard(false);
    router.push('/third', { inTransition: true });
  });

  expect(screen.getByTestId('third')).toBeVisible();
  expect(screen).toHavePathname('/third');
  expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');

  await act(() => router.back());

  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  await act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('settles a queued push and prunes guarded history when a guard flips in the JS stack', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <>
          <Text testID="is-navigating">{String(useIsNavigating())}</Text>
          <JSStack>
            <JSStack.Protected guard={guard}>
              <JSStack.Screen name="secret" />
            </JSStack.Protected>
            <JSStack.Screen name="other" />
            <JSStack.Screen name="third" />
          </JSStack>
        </>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    other: () => <Text testID="other">other</Text>,
    third: () => <Text testID="third">third</Text>,
  });

  await act(() => router.push('/secret'));
  await act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();

  await act(() => {
    setGuard(false);
    router.push('/third', { inTransition: true });
  });

  expect(screen.getByTestId('third')).toBeVisible();
  expect(screen).toHavePathname('/third');
  expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');

  await act(() => router.back());

  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  await act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('removes the guarded history and reveals the anchor below in one flip', async () => {
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
            <>
              <Text testID="is-navigating">{String(useIsNavigating())}</Text>
              <Stack>
                <Stack.Protected guard={guard}>
                  <Stack.Screen name="secret" />
                  <Stack.Screen name="vault" />
                </Stack.Protected>
                <Stack.Screen name="home" />
              </Stack>
            </>
          );
        },
      },
      index: () => <Text testID="index">index</Text>,
      home: () => <Text testID="home">home</Text>,
      vault: () => <Text testID="vault">vault</Text>,
      secret: () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/home' }
  );

  await act(() => router.push('/vault'));
  await act(() => router.push('/secret'));
  expect(screen.getByTestId('secret')).toBeVisible();

  await act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/home');
  expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
  expect(
    navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
  ).toStrictEqual(['home']);
});

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

it('ignores navigation to nested guarded routes and unlocks them as guards flip', async () => {
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
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

  await act(() => router.replace('/c'));
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

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

it('removes a blocked focused route and keeps the history below it in a custom stack navigator', async () => {
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

it('removes a blocked focused route and keeps the history below it in a custom Navigator with a Slot', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Navigator>
          <Protected guard={guard}>
            <Navigator.Screen name="login" />
          </Protected>
          <Slot />
        </Navigator>
      );
    },
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));
  expect(screen.getByTestId('login')).toBeVisible();
  const settingsKey = navigationRef.getRootState().routes[0]!.state!.routes[1]!.key;

  await act(() => setGuard(false));

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
  const state = navigationRef.getRootState().routes[0]!.state!;
  expect(state.routes.map((route) => route.name)).toEqual(['index', 'settings']);
  expect(state.routes[1]!.key).toBe(settingsKey);
});

it('replaces tabs with the stack fallback when every tab becomes guarded', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'login' },
        default: () => <Stack />,
      },
      login: () => <Text testID="login">login</Text>,
      '(tabs)/_layout': function TabsLayout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Tabs>
            <Tabs.Protected guard={signedIn}>
              <Tabs.Screen name="home" />
              <Tabs.Screen name="profile" />
            </Tabs.Protected>
          </Tabs>
        );
      },
      '(tabs)/home': () => <Text testID="home">home</Text>,
      '(tabs)/profile': () => <Text testID="profile">profile</Text>,
    },
    { initialUrl: '/home' }
  );

  expect(screen.getByTestId('home')).toBeVisible();

  await act(() => setSignedIn(false));

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen.queryByTestId('home')).toBeNull();
  expect(screen).toHavePathname('/login');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'login',
  ]);
});

it('ignores a raw push action to a blocked route', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => navigationRef.dispatch(StackActions.push('login')));

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen.queryByTestId('login')).toBeNull();
  expect(screen).toHavePathname('/');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);
});

it('ignores a raw replace action to a blocked route', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false}>
          <Stack.Screen name="login" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
  });

  await act(() => router.push('/settings'));
  await act(() => navigationRef.dispatch(StackActions.replace('login')));

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen.queryByTestId('login')).toBeNull();
  expect(screen).toHavePathname('/settings');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    'settings',
  ]);
});

it('removes only the instance of a fully guarded nested navigator from the parent history', async () => {
  await renderRouter({
    _layout: {
      unstable_settings: { anchor: 'index' },
      default: () => <Stack />,
    },
    index: () => <Text testID="home">home</Text>,
    'projects/[id]/_layout': function ProjectLayout() {
      const { id } = useLocalSearchParams<{ id: string }>();
      return (
        <Stack>
          <Stack.Protected guard={id !== '2'}>
            <Stack.Screen name="index" />
          </Stack.Protected>
        </Stack>
      );
    },
    'projects/[id]/index': () => <Text testID="project">project</Text>,
  });

  await act(() => router.push('/projects/1'));
  await act(() => router.push('/projects/2'));

  expect(screen.getByTestId('project')).toBeVisible();
  expect(screen).toHavePathname('/projects/1');
  expect(
    navigationRef.getRootState().routes[0]!.state!.routes.map((route) => [route.name, route.params])
  ).toEqual([
    ['index', undefined],
    ['projects/[id]', { id: '1' }],
  ]);
});

it('replaces tabs with the stack fallback when every declared tab is guarded and a hidden route is focused', async () => {
  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'login' },
        default: () => <Stack />,
      },
      login: () => <Text testID="login">login</Text>,
      '(tabs)/_layout': () => (
        <Tabs>
          <Tabs.Protected guard={false}>
            <Tabs.Screen name="home" />
          </Tabs.Protected>
        </Tabs>
      ),
      '(tabs)/home': () => <Text testID="home">home</Text>,
      '(tabs)/hidden': () => <Text testID="hidden">hidden</Text>,
    },
    { initialUrl: '/hidden' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen.queryByTestId('hidden')).toBeNull();
  expect(screen).toHavePathname('/login');
});

it('reveals the parent history when a fully guarded navigator is the parent anchor', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: {
        unstable_settings: { anchor: 'account' },
        default: () => <Stack />,
      },
      home: () => <Text testID="home">home</Text>,
      'account/_layout': function AccountLayout() {
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
      'account/index': () => <Text testID="account">account</Text>,
    },
    { initialUrl: '/home' }
  );

  expect(screen.getByTestId('home')).toBeVisible();
  await act(() => router.push('/account'));
  expect(screen.getByTestId('account')).toBeVisible();

  await act(() => setSignedIn(false));

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/home');
});

it('removes a blocked route that a reset with a new navigator key focuses', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false}>
          <Stack.Screen name="secret" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });

  const stack = navigationRef.getRootState().routes[0]!.state!;
  await act(() =>
    navigationRef.dispatch({
      type: 'RESET',
      payload: {
        ...stack,
        key: 'stack-after-reset',
        index: 1,
        routes: [
          { key: 'index-after-reset', name: 'index' },
          { key: 'secret-after-reset', name: 'secret' },
        ],
      },
      target: stack.key,
    })
  );

  expect(screen.getByTestId('home')).toBeVisible();
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);
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

it('replaces a blocked focused route with its redirectTo route in place', async () => {
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

it('ignores a push to a blocked route without redirectTo', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false}>
          <Stack.Screen name="secret" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });
  await act(() => router.push('/settings'));

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => router.push('/secret'));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([]);
  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
});

it('ignores a replace to a blocked route without redirectTo', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false}>
          <Stack.Screen name="secret" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });
  await act(() => router.push('/settings'));

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => router.replace('/secret'));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([]);
  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
});

it('pushes the redirectTo target instead of a blocked route', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="/login">
          <Stack.Screen name="secret" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });
  await act(() => router.push('/settings'));

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => router.push('/secret'));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([['index', 'settings', 'login']]);
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('replaces with the redirectTo target instead of a blocked route', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="/login">
          <Stack.Screen name="secret" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });
  await act(() => router.push('/settings'));

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => router.replace('/secret'));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([['index', 'login']]);
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('follows a redirectTo chain through blocked routes to the final destination', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="/vip">
          <Stack.Screen name="secret" />
        </Stack.Protected>
        <Stack.Protected guard={false} redirectTo="/login">
          <Stack.Screen name="vip" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    login: () => <Text testID="login">login</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    vip: () => <Text testID="vip">vip</Text>,
  });

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => router.push('/secret'));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([['index', 'login']]);
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('resolves a relative redirectTo against the blocked route', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="./login">
            <Stack.Screen name="private/secret" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => <Text testID="home">home</Text>,
      'public/home': () => <Text testID="public-home">public home</Text>,
      'public/login': () => <Text testID="public-login">public login</Text>,
      'private/login': () => <Text testID="private-login">private login</Text>,
      'private/secret': () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/public/home' }
  );

  await act(() => router.push('/private/secret'));

  expect(screen.getByTestId('private-login')).toBeVisible();
  expect(screen).toHavePathname('/private/login');
});

it('resolves a relative redirectTo without the relativeToDirectory option of the navigation', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="./login">
            <Stack.Screen name="private/secret" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => <Text testID="home">home</Text>,
      'private/home': () => <Text testID="private-home">private home</Text>,
      'private/login': () => <Text testID="private-login">private login</Text>,
      'private/secret': () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/private/home' }
  );

  await act(() => router.push('/private/secret', { relativeToDirectory: true }));

  expect(screen.getByTestId('private-login')).toBeVisible();
  expect(screen).toHavePathname('/private/login');
});

it('opens a shared redirectTo route in the group of the blocked route', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="(two)/secret" />
          </Stack.Protected>
        </Stack>
      ),
      '(one)/home': () => <Text testID="one-home">one home</Text>,
      '(one)/login': () => <Text testID="one-login">one login</Text>,
      '(two)/login': () => <Text testID="two-login">two login</Text>,
      '(two)/secret': () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/(one)/home' }
  );

  await act(() => router.push('/(two)/secret'));

  expect(screen.getByTestId('two-login')).toBeVisible();
  expect(screen).toHaveSegments(['(two)', 'login']);
});

it('follows a redirectTo chain back to the same href when it opens a route in another group', async () => {
  await renderRouter(
    {
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/(two)/secret">
            <Stack.Screen name="(one)/login" />
          </Stack.Protected>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="(two)/secret" />
          </Stack.Protected>
        </Stack>
      ),
      '(one)/home': () => <Text testID="one-home">one home</Text>,
      '(one)/login': () => <Text testID="one-login">one login</Text>,
      '(two)/login': () => <Text testID="two-login">two login</Text>,
      '(two)/secret': () => <Text testID="secret">secret</Text>,
    },
    { initialUrl: '/(one)/home' }
  );

  await act(() => router.push('/login'));

  expect(screen.getByTestId('two-login')).toBeVisible();
  expect(screen).toHaveSegments(['(two)', 'login']);
});

it('throws when the redirectTo of a passing Protected component is an external URL', async () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  try {
    await expect(
      renderRouter({
        _layout: () => (
          <Stack>
            <Stack.Protected guard redirectTo="https://example.com/login">
              <Stack.Screen name="secret" />
            </Stack.Protected>
          </Stack>
        ),
        index: () => <Text testID="home">home</Text>,
        secret: () => <Text testID="secret">secret</Text>,
      })
    ).rejects.toThrow(
      'Expo Router could not use the `redirectTo` "https://example.com/login" of a `Protected` component in "app/_layout", because it is an external URL. ' +
        '`redirectTo` accepts only routes of the app. ' +
        'Set `redirectTo` to a route of the app, and open the external URL from your app code, for example with `Linking.openURL`.'
    );
  } finally {
    errorSpy.mockRestore();
  }
});

it('throws when the redirectTo targets of blocked routes form a loop', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="/vip">
          <Stack.Screen name="secret" />
        </Stack.Protected>
        <Stack.Protected guard={false} redirectTo="/secret">
          <Stack.Screen name="vip" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    secret: () => <Text testID="secret">secret</Text>,
    vip: () => <Text testID="vip">vip</Text>,
  });

  await expect(async () => {
    await act(() => router.push('/secret'));
  }).rejects.toThrow(
    'Expo Router could not open "/secret" because the `redirectTo` targets of protected routes form a loop or a chain longer than 20 routes: /secret -> /vip -> /secret. ' +
      'Change `redirectTo` on a `Protected` component so that the redirects end at an accessible route.'
  );
});

it('throws when the redirectTo of a blocked layout opens a route inside that layout', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="/account/login">
              <Stack.Screen name="account" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      'account/_layout': () => <Stack />,
      'account/profile': () => <Text testID="profile">profile</Text>,
      'account/login': () => <Text testID="account-login">account login</Text>,
    },
    { initialUrl: '/account/profile' }
  );

  await expect(async () => {
    await act(() => setSignedIn(false));
  }).rejects.toThrow(
    'Expo Router could not open "/account" because the `redirectTo` targets of protected routes form a loop or a chain longer than 20 routes: /account -> /account/login. ' +
      'Change `redirectTo` on a `Protected` component so that the redirects end at an accessible route.'
  );
});

it('throws when the redirectTo targets of blocked routes form a chain longer than 20 routes', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="./child/secret">
          <Stack.Screen name="[...slug]" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="home">home</Text>,
    '[...slug]': () => <Text testID="slug">slug</Text>,
  });

  await expect(async () => {
    await act(() => router.push('/secret'));
  }).rejects.toThrow(
    'Expo Router could not open "/secret" because the `redirectTo` targets of protected routes form a loop or a chain longer than 20 routes: ' +
      '/secret -> ' +
      '/child/secret -> ' +
      '/child/child/secret -> ' +
      '/child/child/child/secret -> ' +
      '/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret. ' +
      'Change `redirectTo` on a `Protected` component so that the redirects end at an accessible route.'
  );
});

it('throws when a guard change starts a redirectTo chain longer than 20 routes', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="./child/secret">
              <Stack.Screen name="[...slug]" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="home">home</Text>,
      '[...slug]': () => <Text testID="slug">slug</Text>,
    },
    { initialUrl: '/secret' }
  );

  await expect(async () => {
    await act(() => setSignedIn(false));
  }).rejects.toThrow(
    'Expo Router could not open "/secret" because the `redirectTo` targets of protected routes form a loop or a chain longer than 20 routes: ' +
      '/secret -> ' +
      '/child/secret -> ' +
      '/child/child/secret -> ' +
      '/child/child/child/secret -> ' +
      '/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret -> ' +
      '/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/child/secret. ' +
      'Change `redirectTo` on a `Protected` component so that the redirects end at an accessible route.'
  );
});

it('opens the redirectTo route of the blocked screen before the navigation from the same handler', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={!signedIn} redirectTo="/home">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      home: () => <Text testID="home">home</Text>,
      profile: () => <Text testID="profile">profile</Text>,
      login: () => <Text testID="login">login</Text>,
    },
    { initialUrl: '/login' }
  );

  // The navigator tree renders before `RoutingQueueDrainer`, so the guard runs before the push.
  await act(() => {
    setSignedIn(true);
    router.push('/profile');
  });

  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'home',
    'profile',
  ]);
});

it('replaces the blocked screen with its redirectTo route before opening another tab from the same handler', async () => {
  const SignedInContext = createContext(false);
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <SignedInContext value={signedIn}>
            <Tabs>
              <Tabs.Screen name="(home)" />
              <Tabs.Screen name="settings" />
            </Tabs>
          </SignedInContext>
        );
      },
      '(home)/_layout': function HomeLayout() {
        const signedIn = use(SignedInContext);
        return (
          <Stack>
            <Stack.Protected guard={!signedIn} redirectTo="/profile">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      '(home)/index': () => <Text testID="index">index</Text>,
      '(home)/login': () => <Text testID="login">login</Text>,
      '(home)/profile': () => <Text testID="profile">profile</Text>,
      settings: () => <Text testID="settings">settings</Text>,
    },
    { initialUrl: '/login' }
  );

  await act(() => {
    setSignedIn(true);
    router.navigate('/settings');
  });

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
  expect(
    navigationRef
      .getRootState()
      .routes[0]!.state!.routes[0]!.state!.routes.map((route) => route.name)
  ).toEqual(['profile']);

  await fireEvent.press(screen.getByLabelText('(home), tab, 1 of 2'));
  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile');
});

it('removes the blocked screen without redirectTo before the navigation from the same handler', async () => {
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
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      profile: () => <Text testID="profile">profile</Text>,
      login: () => <Text testID="login">login</Text>,
    },
    { initialUrl: '/login' }
  );

  await act(() => {
    setSignedIn(true);
    router.push('/profile');
  });

  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    'profile',
  ]);
});

it('opens the redirectTo route of the blocked screen before a navigation that follows an await in the same handler', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={!signedIn} redirectTo="/home">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      home: () => <Text testID="home">home</Text>,
      profile: () => <Text testID="profile">profile</Text>,
      login: () => <Text testID="login">login</Text>,
    },
    { initialUrl: '/login' }
  );

  await act(async () => {
    setSignedIn(true);
    await Promise.resolve();
    router.push('/profile');
  });

  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'home',
    'profile',
  ]);
});

it('removes a blocked screen with redirectTo from a hidden tab and does not redirect when the tab opens again', async () => {
  const SignedInContext = createContext(false);
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [signedIn, setState] = useState(false);
      setSignedIn = setState;
      return (
        <SignedInContext value={signedIn}>
          <Tabs>
            <Tabs.Screen name="(home)" />
            <Tabs.Screen name="settings" />
          </Tabs>
        </SignedInContext>
      );
    },
    '(home)/_layout': function HomeLayout() {
      const signedIn = use(SignedInContext);
      return (
        <Stack>
          <Stack.Protected guard={!signedIn} redirectTo="/profile">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      );
    },
    '(home)/index': () => <Text testID="index">index</Text>,
    '(home)/login': () => <Text testID="login">login</Text>,
    '(home)/profile': () => <Text testID="profile">profile</Text>,
    settings: () => <Text testID="settings">settings</Text>,
  });

  await act(() => router.push('/login'));
  await act(() => router.navigate('/settings'));

  await act(() => setSignedIn(true));

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(
    navigationRef
      .getRootState()
      .routes[0]!.state!.routes[0]!.state!.routes.map((route) => route.name)
  ).toEqual(['index']);

  await fireEvent.press(screen.getByLabelText('(home), tab, 1 of 2'));

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('replaces the blocked focused route and removes the other blocked routes in one state change', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack>
          <Stack.Protected guard={guard} redirectTo="/home">
            <Stack.Screen name="secret-a" />
            <Stack.Screen name="secret-b" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    home: () => <Text testID="home">home</Text>,
    'secret-a': () => <Text testID="secret-a">secret a</Text>,
    'secret-b': () => <Text testID="secret-b">secret b</Text>,
  });

  await act(() => router.push('/secret-a'));
  await act(() => router.push('/secret-b'));

  const committedRouteNames: string[][] = [];
  const unsubscribe = navigationRef.addListener('state', () => {
    committedRouteNames.push(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    );
  });
  try {
    await act(() => setGuard(false));
  } finally {
    unsubscribe();
  }

  expect(committedRouteNames).toEqual([['index', 'home']]);
  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/home');
});

it('resolves a relative redirectTo against a blocked layout route, not the nested route it shows', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="./login">
              <Stack.Screen name="account" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      'account/_layout': {
        unstable_settings: { anchor: 'settings' },
        default: () => <Stack />,
      },
      'account/index': () => <Text testID="account">account</Text>,
      'account/settings': () => <Text testID="account-settings">account settings</Text>,
      'account/login': () => <Text testID="account-login">account login</Text>,
    },
    { initialUrl: '/account/settings' }
  );

  await act(() => setSignedIn(false));

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'login',
  ]);
});

it('resolves a relative redirectTo against a blocked layout route when pushing a nested route', async () => {
  await renderRouter({
    _layout: () => (
      <Stack>
        <Stack.Protected guard={false} redirectTo="./login">
          <Stack.Screen name="account" />
        </Stack.Protected>
      </Stack>
    ),
    index: () => <Text testID="index">index</Text>,
    login: () => <Text testID="login">login</Text>,
    'account/_layout': () => <Stack />,
    'account/settings': () => <Text testID="account-settings">account settings</Text>,
    'account/login': () => <Text testID="account-login">account login</Text>,
  });

  await act(() => router.push('/account/settings'));

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    'login',
  ]);
});

it('resolves a relative redirectTo against a blocked layout route with the params of its parent routes', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter(
    {
      _layout: () => <Stack />,
      '[org]/_layout': function OrgLayout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="./login">
              <Stack.Screen name="projects" />
            </Stack.Protected>
          </Stack>
        );
      },
      '[org]/index': () => <Text testID="org">org</Text>,
      '[org]/login': () => <Text testID="org-login">org login</Text>,
      '[org]/projects/_layout': {
        unstable_settings: { anchor: 'settings' },
        default: () => <Stack />,
      },
      '[org]/projects/index': () => <Text testID="projects">projects</Text>,
      '[org]/projects/settings': () => <Text testID="project-settings">project settings</Text>,
    },
    { initialUrl: '/acme/projects/settings' }
  );

  await act(() => setSignedIn(false));

  expect(screen.getByTestId('org-login')).toBeVisible();
  expect(screen).toHavePathname('/acme/login');
});

it('waits for the layout of the redirectTo route to read its anchor before the navigation from the same handler', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;
  const dashboard = lazyModule({
    unstable_settings: { anchor: 'overview' },
    default: () => <Stack />,
  });
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  try {
    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setState] = useState(false);
          setSignedIn = setState;
          return (
            <Stack>
              <Stack.Protected guard={!signedIn} redirectTo="/dashboard/stats">
                <Stack.Screen name="login" />
              </Stack.Protected>
            </Stack>
          );
        },
        index: () => <Text testID="index">index</Text>,
        login: () => <Text testID="login">login</Text>,
        settings: () => <Text testID="settings">settings</Text>,
        'dashboard/_layout': dashboard.load,
        'dashboard/index': () => <Text testID="dashboard">dashboard</Text>,
        'dashboard/overview': () => <Text testID="overview">overview</Text>,
        'dashboard/stats': () => <Text testID="stats">stats</Text>,
      },
      { initialUrl: '/login' }
    );

    await act(() => {
      setSignedIn(true);
      router.push('/settings');
    });
    expect(screen).toHavePathname('/login');

    await act(async () => dashboard.resolve());

    expect(warn).not.toHaveBeenCalled();
    expect(screen.getByTestId('settings')).toBeVisible();
    expect(screen).toHavePathname('/settings');
    const state = navigationRef.getRootState().routes[0]!.state!;
    expect(state.routes.map((route) => route.name)).toEqual(['dashboard', 'settings']);
    expect(state.routes[0]!.state!.routes.map((route) => route.name)).toEqual(['stats']);
    expect(state.routes[0]!.state!.routeNames).toEqual(['overview', 'index', 'stats']);
  } finally {
    warn.mockRestore();
  }
});

it('removes a blocked preloaded route', async () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [guard, setState] = useState(true);
      setGuard = setState;
      return (
        <Stack>
          <Stack.Protected guard={guard}>
            <Stack.Screen name="secret" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    secret: () => <Text testID="secret">secret</Text>,
  });

  await act(() => router.prefetch('/secret'));
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    'secret',
  ]);

  await act(() => setGuard(false));

  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
  ]);
});

it('opens the redirectTo route of the blocked screen before a push in a transition to a suspending route', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;
  let resolve!: (value: string) => void;
  const pending = new Promise<string>((done) => {
    resolve = done;
  });

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(false);
        setSignedIn = setState;
        return (
          <Stack>
            <Stack.Protected guard={!signedIn} redirectTo="/home">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      home: () => <Text testID="home">home</Text>,
      login: () => <Text testID="login">login</Text>,
      profile: function Profile() {
        return <Text testID="profile">{use(pending)}</Text>;
      },
    },
    { initialUrl: '/login' }
  );

  const transition = reactAct(() => {
    setSignedIn(true);
    router.push('/profile', { inTransition: true });
  });
  expect(screen).toHavePathname('/home');

  await act(() => resolve('profile'));
  await transition;

  expect(screen.getByTestId('profile')).toBeVisible();
  expect(screen).toHavePathname('/profile');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'home',
    'profile',
  ]);
});

it('removes the blocked focused screen when its redirectTo chain ends at a route without redirectTo', async () => {
  let setSignedIn: Dispatch<SetStateAction<boolean>>;

  await renderRouter({
    _layout: function Layout() {
      const [signedIn, setState] = useState(false);
      setSignedIn = setState;
      return (
        <Stack>
          <Stack.Protected guard={!signedIn} redirectTo="/welcome">
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={!signedIn}>
            <Stack.Screen name="welcome" />
          </Stack.Protected>
        </Stack>
      );
    },
    index: () => <Text testID="index">index</Text>,
    settings: () => <Text testID="settings">settings</Text>,
    login: () => <Text testID="login">login</Text>,
    welcome: () => <Text testID="welcome">welcome</Text>,
  });

  await act(() => router.push('/settings'));
  await act(() => router.push('/login'));

  await act(() => setSignedIn(true));

  expect(screen.getByTestId('settings')).toBeVisible();
  expect(screen).toHavePathname('/settings');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'index',
    'settings',
  ]);
});

it('unmounts a nested layout in the same commit as its blocked parent route', async () => {
  const SignedInContext = createContext(true);
  let setSignedIn: Dispatch<SetStateAction<boolean>>;
  const events: string[] = [];

  await renderRouter({
    _layout: function Layout() {
      const [signedIn, setState] = useState(true);
      setSignedIn = setState;
      return (
        <SignedInContext value={signedIn}>
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="/login">
              <Stack.Screen name="(app)" />
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        </SignedInContext>
      );
    },
    login: () => <Text testID="login">login</Text>,
    goodbye: function Goodbye() {
      useEffect(() => {
        events.push('goodbye mounted');
      }, []);
      return <Text testID="goodbye">goodbye</Text>;
    },
    '(app)/_layout': function AppLayout() {
      const signedIn = use(SignedInContext);
      useEffect(() => {
        events.push(`app layout committed with signedIn ${signedIn}`);
        return () => {
          events.push('app layout unmounted');
        };
      }, [signedIn]);
      return (
        <Stack>
          <Stack.Protected guard={signedIn} redirectTo="/goodbye">
            <Stack.Screen name="index" />
          </Stack.Protected>
        </Stack>
      );
    },
    '(app)/index': () => <Text testID="home">home</Text>,
    '(app)/settings': () => <Text testID="settings">settings</Text>,
  });

  expect(screen.getByTestId('home')).toBeVisible();

  await act(() => setSignedIn(false));

  expect(events).toEqual(['app layout committed with signedIn true', 'app layout unmounted']);
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'login',
  ]);
});

it('uses the root guard redirectTo and does not run the guard of a nested layout', async () => {
  const SignedInContext = createContext(true);
  let setSignedIn: Dispatch<SetStateAction<boolean>>;
  const events: string[] = [];

  await renderRouter(
    {
      _layout: function Layout() {
        const [signedIn, setState] = useState(true);
        setSignedIn = setState;
        return (
          <SignedInContext value={signedIn}>
            <Stack>
              <Stack.Protected guard={signedIn} redirectTo="/login">
                <Stack.Screen name="(app)" />
              </Stack.Protected>
              <Stack.Screen name="login" />
            </Stack>
          </SignedInContext>
        );
      },
      login: () => <Text testID="login">login</Text>,
      '(app)/_layout': function AppLayout() {
        const signedIn = use(SignedInContext);
        return (
          <Stack>
            <Stack.Protected guard={signedIn}>
              <Stack.Screen name="profile" />
            </Stack.Protected>
          </Stack>
        );
      },
      // The nested guard would open its fallback, `(app)/index`.
      '(app)/index': function Home() {
        useEffect(() => {
          events.push('home mounted');
        }, []);
        return <Text testID="home">home</Text>;
      },
      '(app)/profile': () => <Text testID="profile">profile</Text>,
    },
    { initialUrl: '/profile' }
  );
  expect(screen.getByTestId('profile')).toBeVisible();
  expect(events).toEqual([]);

  await act(() => setSignedIn(false));

  expect(events).toEqual([]);
  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
  expect(navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)).toEqual([
    'login',
  ]);
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
