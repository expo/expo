import { createContext, Fragment, use, useEffect, useLayoutEffect, useState } from 'react';
import { Text } from 'react-native';
import type { NavigatorArgs } from 'standard-navigation';

import { navigationRef } from '../global-state/navigationRef';
import { usePathname } from '../hooks';
import { router } from '../imperative-api';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import { StackActions, type NavigationProp, type ParamListBase } from '../react-navigation/native';
import { StackRouter, TabRouter, type NavigationState } from '../react-navigation/routers';
import { createStandardRouterNavigator } from '../standard-navigation';
import { appendMissingPlaceholderTabDescriptors } from '../standard-navigation/appendMissingPlaceholderTabRoutes';
import { act, renderRouter, screen } from '../testing-library';
import { useNavigation } from '../useNavigation';
import { Navigator, Slot } from '../views/Navigator';
import { Protected } from '../views/Protected';

// Records every call so that an intermediate blocked descriptor cannot pass an assertion on the
// settled state. Arguments: navigator args, the navigator state context, the root state context.
const renderProbe = jest.fn<
  void,
  [NavigatorArgs<object, Record<never, never>>, NavigationState, NavigationState]
>();
const effectProbe = jest.fn<void, [NavigatorArgs<object, Record<never, never>>]>();
const mountProbe = jest.fn();
function Content(args: NavigatorArgs<object, Record<never, never>>) {
  useLayoutEffect(() => {
    mountProbe();
  }, []);
  renderProbe(args, use(NavigatorStateContext)!, use(RootNavigationStateContext)!);
  useLayoutEffect(() => {
    effectProbe(args);
  });
  return args.state.routes.map((route) => (
    <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
  ));
}

const SignedInContext = createContext(true);
const Stack = createStandardRouterNavigator(Content, StackRouter);
const Tabs = createStandardRouterNavigator(Content, TabRouter, {
  processDescriptors: appendMissingPlaceholderTabDescriptors,
});
const FocusedStack = createStandardRouterNavigator(
  ({ state, descriptors }) => descriptors[state.routes[state.index]!.key]!.render(),
  StackRouter
);

afterEach(() => {
  renderProbe.mockReset();
  effectProbe.mockReset();
  mountProbe.mockReset();
  jest.restoreAllMocks();
});

describe('incoming request to a mounted guarded route', () => {
  it('rejects a blocked push, replace and preload without changing Settings', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      login,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;
    renderProbe.mockClear();

    await act(() => router.push('/login'));
    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
    await act(() => router.replace('/login'));
    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
    await act(() => router.prefetch('/login'));
    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);

    expect(renderProbe).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  it('rejects repeated rapid pushes to a blocked route', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      login: () => null,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;

    await act(() => {
      router.push('/login');
      router.push('/login');
      router.replace('/login');
    });

    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
  });

  it('opens a fresh redirect destination with push semantics', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/account">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      login,
      account: () => null,
    });
    await act(() => router.push('/settings'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();

    await act(() => router.push('/login'));

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([
      home,
      settings,
      expect.objectContaining({ name: 'account' }),
    ]);
    expect(
      renderProbe.mock.calls.map(([args]) => args.state.routes.map((route) => route.name))
    ).toEqual([['index', 'settings', 'account']]);
    expect(login).not.toHaveBeenCalled();
  });

  it('opens a fresh redirect destination with replace semantics', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/account">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      login,
      account: () => null,
    });
    await act(() => router.push('/settings'));
    const [home] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();

    await act(() => router.replace('/login'));

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([
      home,
      expect.objectContaining({ name: 'account' }),
    ]);
    expect(
      renderProbe.mock.calls.map(([args]) => args.state.routes.map((route) => route.name))
    ).toEqual([['index', 'account']]);
    expect(login).not.toHaveBeenCalled();
  });

  it('uses the outer failed guard even when only the inner guard supplies a redirect', async () => {
    const account = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Protected guard={false} redirectTo="/account">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      billing: () => null,
      account,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;

    await act(() => router.replace('/billing'));

    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
    expect(account).not.toHaveBeenCalled();
  });

  it('follows a redirect chain to the first accessible destination', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="billing" />
          </Stack.Protected>
          <Stack.Protected guard={false} redirectTo="/account">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      billing: () => null,
      login,
      account: () => null,
    });
    renderProbe.mockClear();

    await act(() => router.push('/billing'));

    expect(
      renderProbe.mock.calls.map(([args]) => args.state.routes.map((route) => route.name))
    ).toEqual([['index', 'account']]);
    expect(login).not.toHaveBeenCalled();
  });

  it('keeps Settings when a redirect chain ends at a guard without a redirect', async () => {
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="billing" />
          </Stack.Protected>
          <Stack.Protected guard={false}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: () => null,
      billing: () => null,
      login: () => null,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;

    await act(() => router.replace('/billing'));

    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
  });

  it('throws when redirects form a cycle, before a blocked screen can mount', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/billing">
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="billing" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      login,
      billing: () => null,
    });

    await expect(async () => {
      await act(() => router.push('/login'));
    }).rejects.toThrow(
      'Protected route redirects form a loop at "/login": each `redirectTo` leads to another blocked route. Set `redirectTo` to a route that is accessible.'
    );
    expect(login).not.toHaveBeenCalled();
  });

  it('resolves a relative redirect from the guarded destination, not from the source', async () => {
    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => null,
        '[org]/_layout': () => (
          <Stack>
            <Stack.Protected guard={false} redirectTo="./upgrade">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        ),
        '[org]/index': () => null,
        '[org]/settings/[tab]': () => null,
        '[org]/billing': () => null,
        '[org]/upgrade': () => null,
      },
      { initialUrl: '/acme/settings/profile' }
    );

    await act(() => router.push('/acme/billing'));

    expect(screen).toHavePathname('/acme/upgrade');
    const org = navigationRef.getRootState().routes[0]!.state!.routes[0]!;
    expect(org.state!.routes.map((route) => route.name)).toEqual(['settings/[tab]', 'upgrade']);
  });
});

it('shows a redirect loop in the root layout error boundary', async () => {
  await renderRouter({
    _layout: {
      default: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/billing">
            <Stack.Screen name="login" />
          </Stack.Protected>
          <Stack.Protected guard={false} redirectTo="/login">
            <Stack.Screen name="billing" />
          </Stack.Protected>
        </Stack>
      ),
      ErrorBoundary: ({ error }: { error: Error }) => (
        <Text testID="root-error">{error.message}</Text>
      ),
    },
    index: () => null,
    login: () => null,
    billing: () => null,
  });

  await act(() => router.push('/login'));

  expect(screen.getByTestId('root-error')).toHaveTextContent(
    'Protected route redirects form a loop at "/login": each `redirectTo` leads to another blocked route. Set `redirectTo` to a route that is accessible.'
  );
});

describe('direct navigator action to a mounted guarded route', () => {
  it('rejects a blocked navigate without changing Settings', async () => {
    let navigation: NavigationProp<ParamListBase>;
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false}>
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: function Settings() {
        navigation = useNavigation<NavigationProp<ParamListBase>>();
        return null;
      },
      login,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(() => navigation.navigate('login'));

    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
    expect(warn).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  it('opens the explicit redirect with the original push', async () => {
    let navigation: NavigationProp<ParamListBase>;
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Stack>
          <Stack.Protected guard={false} redirectTo="/account">
            <Stack.Screen name="login" />
          </Stack.Protected>
        </Stack>
      ),
      index: () => null,
      settings: function Settings() {
        navigation = useNavigation<NavigationProp<ParamListBase>>();
        return null;
      },
      login,
      account: () => null,
    });
    await act(() => router.push('/settings'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();

    await act(() => navigation.dispatch(StackActions.push('login')));

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([
      home,
      settings,
      expect.objectContaining({ name: 'account' }),
    ]);
    expect(
      renderProbe.mock.calls.map(([args]) => args.state.routes.map((route) => route.name))
    ).toEqual([['index', 'settings', 'account']]);
    expect(login).not.toHaveBeenCalled();
  });
});

describe('mounted guard flip', () => {
  it('reveals the same Settings on the first render and commits the cleanup before Back', async () => {
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Stack>
            <Stack.Protected guard={open}>
              <Stack.Screen name="login" />
              <Stack.Screen name="prefetched" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      'settings/_layout': () => <FocusedStack />,
      'settings/[section]': () => null,
      login: () => null,
      prefetched: () => null,
    });
    await act(() => router.push('/settings/display?source=home'));
    await act(() => router.push('/login'));
    await act(() => router.prefetch('/prefetched'));
    const before = navigationRef.getRootState().routes[0]!.state!;
    const [home, settings] = before.routes;
    expect(before.routes.map((route) => route.name)).toEqual([
      'index',
      'settings',
      'login',
      'prefetched',
    ]);
    const rootDuringRender = jest.fn();
    const rootDuringEffect = jest.fn();
    renderProbe
      .mockClear()
      .mockImplementationOnce(() =>
        rootDuringRender(navigationRef.getRootState().routes[0]!.state!)
      );
    effectProbe.mockImplementationOnce(() =>
      rootDuringEffect(navigationRef.getRootState().routes[0]!.state!)
    );

    await act(() => close());

    // The first render after the flip
    const first = renderProbe.mock.calls[0]![0];
    expect(first.state.routes.map((route) => route.name)).toEqual(['index', 'settings']);
    expect(first.state.index).toBe(1);
    expect(first.state.routes[1]).toMatchObject({
      key: settings!.key,
      params: settings!.params,
      state: settings!.state,
    });
    expect(first.state.routes[1]).toMatchObject({
      state: { routes: [{ params: { section: 'display', source: 'home' } }] },
    });
    expect(Object.keys(first.descriptors)).toEqual([home!.key, settings!.key]);
    // Root readers observe the committed state, which lags through the first layout effect.
    expect(renderProbe.mock.calls[0]![2].routes[0]!.state).toBe(before);
    expect(rootDuringRender).toHaveBeenCalledWith(before);
    expect(rootDuringEffect).toHaveBeenCalledWith(before);
    // After settlement
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([home, settings]);
    await act(() => router.back());
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([home]);
    expect(router.canGoBack()).toBe(false);
  });

  it('applies Back from the first layout effect to the revealed Settings', async () => {
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Stack>
            <Stack.Protected guard={open}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      settings: () => null,
      login: () => null,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/login'));
    const [home] = navigationRef.getRootState().routes[0]!.state!.routes;
    effectProbe.mockImplementationOnce(() => router.back());

    await act(() => close());

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([home]);
  });

  it('uses the outer failed guard without a redirect over an inner guard redirect', async () => {
    const account = jest.fn(() => null);
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Stack>
            <Stack.Protected guard={open}>
              <Stack.Protected guard={open} redirectTo="/account">
                <Stack.Screen name="billing" />
              </Stack.Protected>
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      settings: () => null,
      billing: () => null,
      account,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/billing'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;

    await act(() => close());

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([home, settings]);
    expect(account).not.toHaveBeenCalled();
  });

  it('removes a visited background tab from descriptors and history before Back', async () => {
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Tabs backBehavior="history">
            <Tabs.Screen name="index" />
            <Tabs.Protected guard={open} redirectTo="/other">
              <Tabs.Screen name="members" />
            </Tabs.Protected>
            <Tabs.Screen name="settings" />
            <Tabs.Screen name="other" />
          </Tabs>
        );
      },
      index: () => null,
      members: () => null,
      settings: () => null,
      other: () => null,
    });
    await act(() => router.navigate('/members'));
    await act(() => router.navigate('/settings'));
    const [home, , settings] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();

    await act(() => close());

    const first = renderProbe.mock.calls[0]![0];
    expect(first.state.routes.map((route) => route.name)).toEqual(['index', 'settings']);
    expect(Object.keys(first.descriptors)).toEqual([home!.key, settings!.key, 'other']);
    expect(renderProbe.mock.calls[0]![1].history).toEqual([
      { type: 'route', key: home!.key },
      { type: 'route', key: settings!.key },
    ]);
    expect(navigationRef.getRootState().routes[0]!.state!.history).toEqual([
      { type: 'route', key: home!.key },
      { type: 'route', key: settings!.key },
    ]);
    await act(() => router.back());
    const settled = navigationRef.getRootState().routes[0]!.state!;
    expect(settled.routes[settled.index!]!.key).toBe(home!.key);
  });

  it('keeps an all-blocked navigator mounted and empty, then reopens at a fresh anchor', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    let toggle: (open: boolean) => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        toggle = setOpen;
        return (
          <Stack>
            <Stack.Protected guard={open}>
              <Stack.Screen name="index" />
              <Stack.Screen name="details" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      details: () => null,
    });
    await act(() => router.push('/details'));
    const oldHomeKey = navigationRef.getRootState().routes[0]!.state!.routes[0]!.key;
    renderProbe.mockClear();

    await act(() => toggle(false));

    expect(renderProbe.mock.calls[0]![0].state).toEqual({ index: -1, routes: [] });
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([]);
    expect(warn).toHaveBeenCalledWith(
      'All routes in this navigator are protected. Ensure at least one route is accessible.'
    );

    await act(() => toggle(true));

    const reopened = navigationRef.getRootState().routes[0]!.state!.routes;
    expect(reopened).toMatchObject([{ name: 'index' }]);
    expect(reopened[0]!.key).not.toBe(oldHomeKey);
    expect(mountProbe).toHaveBeenCalledTimes(1);
  });

  it('selects the accessible index by route identity when a blocked group shares its URL', async () => {
    let signOut: () => void;
    await renderRouter(
      {
        _layout: function Layout() {
          const [signedIn, setSignedIn] = useState(true);
          signOut = () => setSignedIn(false);
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
        '(app)/_layout': () => <FocusedStack />,
        '(app)/index': () => null,
        index: () => null,
      },
      { initialUrl: '/(app)' }
    );
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toMatchObject([
      { name: '(app)' },
    ]);
    renderProbe.mockClear();

    await act(() => signOut());

    expect(renderProbe.mock.calls[0]![0].state.routes).toMatchObject([
      { name: 'index', href: '/' },
    ]);
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toMatchObject([
      { name: 'index' },
    ]);
    expect(router.canGoBack()).toBe(false);
  });
});

describe('focused explicit redirect on a guard flip', () => {
  it('opens a fresh Home on the first render without focusing Settings', async () => {
    let close: () => void;
    const settingsFocus = jest.fn();
    const homePathnames = jest.fn();
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Stack>
            <Stack.Protected guard={open} redirectTo="/">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: function Home() {
        homePathnames(usePathname());
        return null;
      },
      settings: function Settings() {
        const navigation = useNavigation<NavigationProp<ParamListBase>>();
        useEffect(() => navigation.addListener('focus', settingsFocus), [navigation]);
        return null;
      },
      login: () => null,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/login'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();
    settingsFocus.mockClear();
    homePathnames.mockClear();

    await act(() => close());

    const first = renderProbe.mock.calls[0]![0];
    expect(first.state.routes.map((route) => route.name)).toEqual(['index', 'settings', 'index']);
    expect(first.state.index).toBe(2);
    const freshHomeKey = first.state.routes[2]!.key;
    expect(freshHomeKey).not.toBe(home!.key);
    expect(Object.keys(first.descriptors)).toEqual([home!.key, settings!.key, freshHomeKey]);
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([
      home,
      settings,
      expect.objectContaining({ key: freshHomeKey, name: 'index' }),
    ]);
    expect(settingsFocus).not.toHaveBeenCalled();
    // Root readers lag on the first projected render, then agree with the projection. The URL
    // never switches to Settings.
    expect(homePathnames.mock.calls[0]).toEqual(['/login']);
    expect(homePathnames).not.toHaveBeenCalledWith('/settings');
    expect(homePathnames).toHaveBeenLastCalledWith('/');
    expect(screen).toHavePathname('/');
  });

  it('gives an explicit replacement from the same handler priority over the guard redirect', async () => {
    let finish: () => void;
    const inHandler = jest.fn();
    const account = jest.fn(() => null);
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        finish = () => {
          setOpen(false);
          router.replace('/welcome');
          inHandler(navigationRef.getRootState().routes[0]!.state!.routes.map((r) => r.name));
        };
        return (
          <Stack>
            <Stack.Protected guard={open} redirectTo="/account">
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        );
      },
      index: () => null,
      settings: () => null,
      login: () => null,
      account,
      welcome: () => null,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/login'));
    renderProbe.mockClear();

    await act(() => finish());

    expect(inHandler).toHaveBeenCalledWith(['index', 'settings', 'login']);
    const rendered = renderProbe.mock.calls.map(([args]) =>
      args.state.routes.map((route) => route.name)
    );
    // Login is not shown, but the replace from the handler still replaces Login, not Settings.
    expect(rendered[0]).toEqual(['index', 'settings']);
    expect(rendered).not.toContainEqual(['index', 'settings', 'login']);
    expect(rendered).not.toContainEqual(['index', 'settings', 'account']);
    expect(account).not.toHaveBeenCalled();
    expect(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    ).toEqual(['index', 'settings', 'welcome']);
  });

  it('resolves a relative redirect from the guarded route on a guard flip', async () => {
    let close: () => void;
    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => null,
        '[org]/_layout': function Org() {
          const [open, setOpen] = useState(true);
          close = () => setOpen(false);
          return (
            <Stack>
              <Stack.Protected guard={open} redirectTo="./upgrade">
                <Stack.Screen name="billing" />
              </Stack.Protected>
            </Stack>
          );
        },
        '[org]/index': () => null,
        '[org]/settings/[tab]': () => null,
        '[org]/billing': () => null,
        '[org]/upgrade': () => null,
      },
      { initialUrl: '/acme/settings/profile' }
    );
    await act(() => router.push('/acme/billing'));
    renderProbe.mockClear();

    await act(() => close());

    // The first call after the flip renders the organization stack.
    expect(renderProbe.mock.calls[0]![0].state.routes.map((route) => route.name)).toEqual([
      'settings/[tab]',
      'upgrade',
    ]);
    expect(screen).toHavePathname('/acme/upgrade');
  });

  it('lets a failed parent guard discard the child guard redirect', async () => {
    let signOut: () => void;
    const upgrade = jest.fn(() => null);
    await renderRouter({
      _layout: function Layout() {
        const [signedIn, setSignedIn] = useState(true);
        signOut = () => setSignedIn(false);
        return (
          <SignedInContext value={signedIn}>
            <Stack>
              <Stack.Protected guard={signedIn} redirectTo="/login">
                <Stack.Screen name="account" />
              </Stack.Protected>
            </Stack>
          </SignedInContext>
        );
      },
      index: () => null,
      login: () => null,
      'account/_layout': function Account() {
        const signedIn = use(SignedInContext);
        return (
          <Stack>
            <Stack.Protected guard={signedIn} redirectTo="/account/upgrade">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        );
      },
      'account/index': () => null,
      'account/billing': () => null,
      'account/upgrade': upgrade,
    });
    await act(() => router.push('/account/billing'));
    renderProbe.mockClear();

    await act(() => signOut());

    const rendered = renderProbe.mock.calls.map(([args]) =>
      args.state.routes.map((route) => route.name)
    );
    expect(rendered[0]).toEqual(['index', 'login']);
    expect(rendered).not.toContainEqual(['index', 'account']);
    expect(rendered).not.toContainEqual(['index']);
    expect(upgrade).not.toHaveBeenCalled();
  });
});

describe('explicit redirect or fallback outside the navigator', () => {
  it('opens a redirect to a parent navigator without rendering the blocked screen', async () => {
    let close: () => void;
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <SignedInContext value={open}>
            <Stack />
          </SignedInContext>
        );
      },
      index: () => null,
      settings: () => null,
      login,
      'account/_layout': function Account() {
        const open = use(SignedInContext);
        return (
          <Stack>
            <Stack.Protected guard={open} redirectTo="/login">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        );
      },
      'account/index': () => null,
      'account/billing': () => null,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/account/billing'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;
    renderProbe.mockClear();

    await act(() => close());

    const rendered = renderProbe.mock.calls.map(([args]) =>
      args.state.routes.map((route) => route.name)
    );
    expect(rendered).not.toContainEqual(['billing']);
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([
      home,
      settings,
      expect.objectContaining({ name: 'login' }),
    ]);
    expect(login).toHaveBeenCalled();
    expect(screen).toHavePathname('/login');
  });

  it('opens a nested redirect destination without rendering the blocked screen', async () => {
    let close: () => void;
    await renderRouter({
      _layout: () => <Stack />,
      index: () => null,
      'account/_layout': function Account() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Stack>
            <Stack.Protected guard={open} redirectTo="/account/plans/pro">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        );
      },
      'account/index': () => null,
      'account/billing': () => null,
      'account/plans/_layout': () => <Stack />,
      'account/plans/[plan]': () => null,
    });
    await act(() => router.push('/account'));
    await act(() => router.push('/account/billing'));
    renderProbe.mockClear();

    await act(() => close());

    const rendered = renderProbe.mock.calls.map(([args]) =>
      args.state.routes.map((route) => route.name)
    );
    expect(rendered).not.toContainEqual(['index', 'billing']);
    const account = navigationRef.getRootState().routes[0]!.state!.routes[1]!.state!;
    expect(account.routes.map((route) => route.name)).toEqual(['index', 'plans']);
    expect(screen).toHavePathname('/account/plans/pro');
  });

  it('opens the parent fallback by route identity when every child route is blocked', async () => {
    let close: () => void;
    await renderRouter(
      {
        _layout: () => <Stack />,
        index: () => null,
        '[org]/_layout': () => <Stack />,
        '[org]/index': () => null,
        '[org]/team/_layout': function Team() {
          const [open, setOpen] = useState(true);
          close = () => setOpen(false);
          return (
            <Stack>
              <Stack.Protected guard={open}>
                <Stack.Screen name="index" />
                <Stack.Screen name="members" />
              </Stack.Protected>
            </Stack>
          );
        },
        '[org]/team/index': () => null,
        '[org]/team/members': () => null,
      },
      { initialUrl: '/acme/team/members' }
    );
    renderProbe.mockClear();

    await act(() => close());

    const rendered = renderProbe.mock.calls.map(([args]) =>
      args.state.routes.map((route) => route.name)
    );
    expect(rendered).not.toContainEqual(['members']);
    const org = navigationRef.getRootState().routes[0]!.state!.routes[0]!;
    expect(org.params).toMatchObject({ org: 'acme' });
    expect(org.state!.routes.map((route) => route.name)).toEqual(['index']);
    expect(screen).toHavePathname('/acme');
  });
  it('throws when the redirect of a blocked active screen enters a redirect loop', async () => {
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <SignedInContext value={open}>
            <Stack>
              <Stack.Protected guard={false} redirectTo="/account/billing">
                <Stack.Screen name="login" />
              </Stack.Protected>
            </Stack>
          </SignedInContext>
        );
      },
      index: () => null,
      login: () => null,
      'account/_layout': function Account() {
        const open = use(SignedInContext);
        return (
          <Stack>
            <Stack.Protected guard={open} redirectTo="/login">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        );
      },
      'account/index': () => null,
      'account/billing': () => null,
    });
    await act(() => router.push('/account/billing'));

    await expect(async () => {
      await act(() => close());
    }).rejects.toThrow(
      'Protected route redirects form a loop at "/login": each `redirectTo` leads to another blocked route. Set `redirectTo` to a route that is accessible.'
    );
  });
});

describe('legacy Navigator', () => {
  it('reveals the same Settings when the guard of the active screen fails', async () => {
    let close: () => void;
    await renderRouter({
      _layout: function Layout() {
        const [open, setOpen] = useState(true);
        close = () => setOpen(false);
        return (
          <Navigator>
            <Protected guard={open}>
              <Navigator.Screen name="login" />
            </Protected>
            <Slot />
          </Navigator>
        );
      },
      index: () => null,
      settings: () => null,
      login: () => null,
    });
    await act(() => router.push('/settings'));
    await act(() => router.push('/login'));
    const [home, settings] = navigationRef.getRootState().routes[0]!.state!.routes;

    await act(() => close());

    expect(navigationRef.getRootState().routes[0]!.state!.routes).toEqual([home, settings]);
    expect(screen).toHavePathname('/settings');
  });

  it('rejects a push to a blocked route without changing Settings', async () => {
    const login = jest.fn(() => null);
    await renderRouter({
      _layout: () => (
        <Navigator>
          <Protected guard={false}>
            <Navigator.Screen name="login" />
          </Protected>
          <Slot />
        </Navigator>
      ),
      index: () => null,
      settings: () => null,
      login,
    });
    await act(() => router.push('/settings'));
    const before = navigationRef.getRootState().routes[0]!.state!;

    await act(() => router.push('/login'));

    expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
    expect(login).not.toHaveBeenCalled();
  });
});

describe('cold blocked link', () => {
  it('opens one fallback on the first render and commits the same key', async () => {
    await renderRouter(
      {
        _layout: () => (
          <Stack>
            <Stack.Protected guard={false}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        ),
        index: () => null,
        login: () => null,
      },
      { initialUrl: '/login' }
    );

    const first = renderProbe.mock.calls[0]![0];
    expect(first.state.routes.map((route) => route.name)).toEqual(['index']);
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toMatchObject([
      { key: first.state.routes[0]!.key, name: 'index' },
    ]);
    expect(router.canGoBack()).toBe(false);
  });

  it('keeps the first fallback key when another action is queued before the root catches up', async () => {
    // The imperative router is unavailable during the initial commit, so dispatch through the
    // navigator that rendered the fallback.
    effectProbe.mockImplementationOnce(({ actions }) =>
      actions.navigate('index', { from: 'effect' })
    );

    await renderRouter(
      {
        _layout: () => (
          <Stack>
            <Stack.Protected guard={false}>
              <Stack.Screen name="login" />
            </Stack.Protected>
          </Stack>
        ),
        index: () => null,
        login: () => null,
      },
      { initialUrl: '/login' }
    );

    const firstKey = renderProbe.mock.calls[0]![0].state.routes[0]!.key;
    expect(navigationRef.getRootState().routes[0]!.state!.routes).toMatchObject([
      { key: firstKey, name: 'index', params: { from: 'effect' } },
    ]);
    expect(mountProbe).toHaveBeenCalledTimes(1);
  });
});
