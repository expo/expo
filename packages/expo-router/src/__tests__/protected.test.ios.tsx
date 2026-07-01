import { act, fireEvent, screen } from '@testing-library/react-native';
import type { Dispatch, SetStateAction } from 'react';
import { createContext, use, useState } from 'react';
import { Text } from 'react-native';

import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import Tabs from '../layouts/Tabs';
import { renderRouter } from '../testing-library';

it('redirects a guarded route to the anchor default during the initial load', () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  renderRouter(
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

  // The guarded /a route is no longer dropped — it resolves, then redirects to the anchor
  // (no anchor set, so `/`). Index ends up visible.
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // Enable the /a route
  act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');
  expect(store.state?.routes[0]?.state?.routes.at(-1)?.name).toBe('a');
});

it('redirects nested guarded routes to the anchor and unlocks them as guards flip', () => {
  let useStateResultA: [boolean, Dispatch<SetStateAction<boolean>>];
  let useStateResultB: [boolean, Dispatch<SetStateAction<boolean>>];
  let useStateResultC: [boolean, Dispatch<SetStateAction<boolean>>];

  renderRouter({
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

  // All guards are false: navigating to any protected route redirects to the anchor default (`/`).
  act(() => router.replace('/a'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  act(() => router.replace('/b'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  act(() => router.replace('/c'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // Enable guards A and C. A becomes reachable; C is still blocked because its parent B is false,
  // so navigating to B or C redirects back to the anchor.
  act(() => {
    useStateResultA[1](true);
    useStateResultC[1](true);
  });

  act(() => router.replace('/a'));
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

  act(() => router.replace('/b'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  act(() => router.replace('/c'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // Enable guard B: now every route is reachable.
  act(() => {
    useStateResultB[1](true);
  });

  act(() => router.replace('/a'));
  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');

  act(() => router.replace('/b'));
  expect(screen.getByTestId('b')).toBeVisible();
  expect(screen).toHavePathname('/b');

  act(() => router.replace('/c'));
  expect(screen.getByTestId('c')).toBeVisible();
  expect(screen).toHavePathname('/c');
});

it('defaults a guarded route to the navigator anchor', () => {
  let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

  renderRouter(
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

  // Guarded /a redirects to the anchor `b`.
  expect(screen.getByTestId('b')).toBeVisible();
  expect(screen).toHavePathname('/b');

  // Enable the /a route
  act(() => {
    useStateResult[1](true);
  });

  // Now we should be able to navigate to /a
  // TODO: Allow navigation events while updating state
  act(() => router.replace('/a'));

  expect(screen.getByTestId('a')).toBeVisible();
  expect(screen).toHavePathname('/a');
});

it('redirects a guarded route to an explicit redirectTo target', () => {
  renderRouter(
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

it('redirects a guarded route in a nested navigator to that navigator anchor', () => {
  renderRouter(
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

  // The default target resolves against the nested navigator (prefix `/nested`), not the root.
  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/nested/home');
});

it('redirects a guarded dynamic route to an explicit redirectTo target', () => {
  renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/login">
              <Stack.Screen name="item/[id]" />
            </Stack.Protected>
            <Stack.Screen name="login" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      login: () => <Text testID="login">login</Text>,
      'item/[id]': () => <Text testID="item">item</Text>,
    },
    { initialUrl: '/item/42' }
  );

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('redirects when a guard flips to false while the route is focused', () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  renderRouter(
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

  // Guard starts true, so the focused route renders its content.
  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  // Flipping the guard to false while focused redirects to the anchor default (`/`).
  act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('uses the innermost failing guard redirectTo for a nested guarded route', () => {
  renderRouter(
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

  // The inner guard is the one that fails, so its redirectTo wins.
  expect(screen.getByTestId('inner')).toBeVisible();
  expect(screen).toHavePathname('/inner');
});

it('does not redirect a preloaded guarded route until it is focused', () => {
  renderRouter({
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
  });

  expect(screen).toHavePathname('/');

  // Preloading mounts the guarded screen unfocused: the redirect (fired in useFocusEffect) must
  // not run yet, so we stay on index.
  act(() => {
    router.prefetch('/secret');
  });

  expect(screen).toHavePathname('/');

  // Focusing it triggers the redirect to the explicit target.
  act(() => router.navigate('/secret'));

  expect(screen.getByTestId('login')).toBeVisible();
  expect(screen).toHavePathname('/login');
});

it('resolves a direct duplicate-group URL to a guarded route and honors its redirectTo (#37816)', () => {
  // Regression for #37816 / ENG-22119. A guarded route used to be dropped from `routeNames`, so a
  // direct URL / refresh whose `getStateFromPath` result referenced it was rejected on rehydration
  // and fell back to index. The drop-vs-keep logic is shared across platforms; this reproduces the
  // reported topology (the web-only harness can't run `renderRouter`).
  //
  // Duplicate groups `(creator)`/`(guest)` both serve `/detail`; `getStateFromPath` resolves the
  // shared URL to the higher-sorted `(creator)/detail`. Since guarding no longer drops that route,
  // the URL resolves and the guard's `redirectTo` is honored (rather than the state being rejected).
  renderRouter(
    {
      _layout: function Layout() {
        return (
          <Stack id={undefined}>
            <Stack.Protected guard={false} redirectTo="/other">
              <Stack.Screen name="(creator)/detail" />
            </Stack.Protected>
            <Stack.Screen name="(guest)/detail" />
            <Stack.Screen name="other" />
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      other: () => <Text testID="other">other</Text>,
      '(creator)/detail': () => <Text testID="creator">creator</Text>,
      '(guest)/detail': () => <Text testID="guest">guest</Text>,
    },
    { initialUrl: '/detail' }
  );

  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');
});

it('will wait for React state updates before pushing', async () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  renderRouter({
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

  fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/protected');
});

it('works with tabs', () => {
  const SetterContext = createContext<Dispatch<SetStateAction<boolean>>>(() => {});

  renderRouter({
    _layout: function Layout() {
      const [value, setState] = useState(false);

      return (
        <SetterContext value={setState}>
          <Tabs>
            <Tabs.Screen name="index" />
            <Tabs.Screen name="other" />

            <Tabs.Protected guard={value} redirectTo="/other">
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
    other: () => <Text testID="other">other</Text>,
    protected: function Nested() {
      return <Text testID="protected">Protected</Text>;
    },
  });

  // A guarded JS tab is no longer dropped: the tab is present, but focusing it redirects to its
  // `redirectTo`. Landing on `/other` (not `/`) proves the redirect engaged rather than a no-op.
  fireEvent.press(screen.getByTestId('index'));
  expect(screen).toHavePathname('/other');

  // Return to the index tab, then enabling the guard lets the tab render its content.
  act(() => router.navigate('/'));
  fireEvent(screen.getByTestId('index'), 'longPress');

  expect(screen).toHavePathname('/protected');
  expect(screen.queryByLabelText('protected, tab, 3 of 3')).toBeVisible();
});

describe('routes without /index suffix', () => {
  describe('Protected', () => {
    it('should protect dynamic routes without explicit /index suffix', () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      renderRouter(
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

      act(() => {
        useStateResult[1](true);
      });

      act(() => router.replace('/otp/signin'));

      expect(screen.getByTestId('otp')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin');
    });

    it('should protect routes when _layout exists alongside index', () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      renderRouter(
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

      act(() => {
        useStateResult[1](true);
      });

      act(() => router.replace('/otp/signin'));

      expect(screen.getByTestId('otp')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin');
    });

    it('should protect routes when _layout exists without index', () => {
      let useStateResult: [boolean, Dispatch<SetStateAction<boolean>>];

      renderRouter(
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

      act(() => {
        useStateResult[1](true);
      });

      act(() => router.replace('/otp/signin/step1'));

      expect(screen.getByTestId('step1')).toBeVisible();
      expect(screen).toHavePathname('/otp/signin/step1');
    });

    it('should throw when both name="otp/[flow]" and name="otp/[flow]/index" are used', () => {
      expect(() =>
        renderRouter(
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
      ).toThrow('Screen names must be unique');
    });
  });
});
