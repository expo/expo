import { Fragment, use, useLayoutEffect, useState } from 'react';
import type { NavigatorArgs } from 'standard-navigation';

import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import { StackActions, type NavigationProp, type ParamListBase } from '../react-navigation/native';
import { StackRouter, TabRouter, type NavigationState } from '../react-navigation/routers';
import { createStandardRouterNavigator } from '../standard-navigation';
import { appendMissingPlaceholderTabDescriptors } from '../standard-navigation/appendMissingPlaceholderTabRoutes';
import { act, renderRouter, screen } from '../testing-library';
import { useNavigation } from '../useNavigation';

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
