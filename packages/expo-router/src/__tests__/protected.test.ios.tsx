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

  // Guarded /a is unreachable during initial load: index is shown at /.
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
  expect(store.state!.routes[0]!.state!.routeNames).toStrictEqual(['a', 'index', 'b', 'c']);
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

  // try to navigate to all protected routes should not change the current
  // route since all the guards are false
  act(() => router.replace('/a'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  act(() => router.replace('/b'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  act(() => router.replace('/c'));
  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');

  // change the guards for routes A and C to true: should make A available but
  // not C as it is nested under B and the guard for B is still false
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

  // change the guard for route B to true: should make B available and also C
  // should be available now as all its parents guards are true
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

  expect(store.state!.routes[0]!.state!.routeNames).toStrictEqual(['a', 'b', 'c', 'index']);
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

  // Guarded /a is unreachable; the anchor route b is shown instead.
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
  expect(store.state!.routes[0]!.state!.routeNames).toStrictEqual(['a', 'b', 'index']);
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

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/nested/home');
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

  expect(screen.getByTestId('inner')).toBeVisible();
  expect(screen).toHavePathname('/inner');
});

it('applies the parent guard redirectTo to a route nested in a passing child guard', () => {
  renderRouter(
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

it('does not apply the parent guard redirectTo to a route nested in a passing child guard when parent guard is true', () => {
  renderRouter(
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


it('should move away from a focused route when its guard flips false', () => {
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

  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
});

it('should remove guarded routes from history when a guard flips false', () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  renderRouter({
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

  act(() => router.push('/secret'));
  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  act(() => {
    setGuard(false);
  });

  act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('should not restore pruned guarded history when a guard flips true->false->true', () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  renderRouter({
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

  act(() => router.push('/secret'));
  expect(screen.getByTestId('secret')).toBeVisible();
  expect(screen).toHavePathname('/secret');

  act(() => router.push('/other'));
  expect(screen.getByTestId('other')).toBeVisible();
  expect(screen).toHavePathname('/other');

  // Revoke access: the guarded /secret history entry is pruned.
  act(() => {
    setGuard(false);
  });

  // Re-grant access while still on /other.
  act(() => {
    setGuard(true);
  });

  // Flipping the guard back to true must not resurrect the pruned /secret entry.
  act(() => router.back());

  expect(screen.getByTestId('index')).toBeVisible();
  expect(screen).toHavePathname('/');
  expect(router.canGoBack()).toBe(false);
});

it('should use the anchor when a focused route guard flips false', () => {
  let setGuard: Dispatch<SetStateAction<boolean>>;

  renderRouter(
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

  act(() => {
    setGuard(false);
  });

  expect(screen.getByTestId('home')).toBeVisible();
  expect(screen).toHavePathname('/home');
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

  fireEvent.press(screen.getByTestId('index'));

  expect(screen).toHavePathname('/');

  fireEvent(screen.getByTestId('index'), 'longPress');

  expect(screen).toHavePathname('/protected');
  expect(screen.queryByLabelText('protected, tab, 2 of 2')).toBeVisible();
});

describe('all routes guarded', () => {
  let consoleWarnSpy: jest.SpyInstance<void, Parameters<typeof console.warn>>;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  it('renders nothing without crashing when every route is guarded from the start', () => {
    renderRouter({
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
      'All routes in this navigator are protected. Ensure at least one route is accessible.'
    );
    // The navigator itself stays mounted (previously it rendered null when all
    // its routes were guarded).
    expect(JSON.stringify(screen.toJSON())).toContain('RNSScreenStack');
  });

  it('keeps navigation state when all guards flip false and back to true', () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;

    renderRouter({
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

    act(() => router.push('/second'));
    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen).toHavePathname('/second');

    const stateBefore = store.state!.routes[0]!.state!;
    const focusedKeyBefore = stateBefore.routes[stateBefore.index!]!.key;

    // Guard everything: content hides but the navigator must stay mounted.
    act(() => {
      setGuard(false);
    });

    expect(screen.queryByTestId('index')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();

    // Restore access: the same navigation state is still there, not reinitialized.
    act(() => {
      setGuard(true);
    });

    expect(screen.getByTestId('second')).toBeVisible();
    expect(screen).toHavePathname('/second');
    const stateAfter = store.state!.routes[0]!.state!;
    expect(stateAfter.routes[stateAfter.index!]!.key).toBe(focusedKeyBefore);
    // Non-focused guarded history entries are pruned while the guard is down,
    // so only the focused route survives the flip.
    expect(stateAfter.routes).toHaveLength(1);
  });

  it('redirects to the parent anchor when all nested guards flip false', () => {
    let setGuard: Dispatch<SetStateAction<boolean>>;

    renderRouter(
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

    act(() => setGuard(false));

    expect(screen.getByTestId('index')).toBeVisible();
    expect(screen).toHavePathname('/');
  });

  it('does not redirect when the parent anchor is the fully guarded navigator', () => {
    renderRouter(
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
      'All routes in this navigator are protected. Ensure at least one route is accessible.'
    );
  });

  it('skips a self-targeting parent anchor and redirects to the grandparent anchor', () => {
    renderRouter(
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

  it('uses updated params from an object redirectTo', () => {
    let setId: Dispatch<SetStateAction<string>>;

    renderRouter({
      _layout: function Layout() {
        const [id, setState] = useState('one');
        setId = setState;
        return (
          <Stack id={undefined}>
            <Stack.Protected
              guard={false}
              redirectTo={{ pathname: '/login/[id]', params: { id } }}>
              <Stack.Screen name="secret" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => <Text testID="index">index</Text>,
      secret: () => <Text testID="secret">secret</Text>,
      'login/[id]': () => <Text testID="login">login</Text>,
    });

    act(() => setId('two'));
    act(() => router.push('/secret'));

    expect(screen.getByTestId('login')).toBeVisible();
    expect(screen).toHavePathname('/login/two');
  });

  it('preserves a parent anchor whose name ends in index', () => {
    renderRouter(
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

  it('redirects out of a pathless group to the parent index', () => {
    renderRouter(
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

  it('redirects to the configured pathless group when groups share a URL', () => {
    renderRouter(
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

  it('preserves params in a dynamic parent anchor', () => {
    renderRouter(
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

  it('does not render guarded content when pushing directly to a route guarded with no destination', () => {
    renderRouter({
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

    act(() => router.push('/second'));

    expect(screen.queryByTestId('index')).toBeNull();
    expect(screen.queryByTestId('second')).toBeNull();
  });

  it('redirects out of a fully guarded nested navigator via redirectTo', () => {
    renderRouter(
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
