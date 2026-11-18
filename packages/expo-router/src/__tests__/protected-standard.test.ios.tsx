import { Fragment, use, useLayoutEffect } from 'react';
import type { NavigatorArgs } from 'standard-navigation';

import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import { RootNavigationStateContext } from '../react-navigation/core/RootNavigationStateContext';
import { NavigatorStateContext } from '../react-navigation/core/useNavigationState';
import { StackActions, type NavigationProp, type ParamListBase } from '../react-navigation/native';
import { StackRouter, type NavigationState } from '../react-navigation/routers';
import { createStandardRouterNavigator } from '../standard-navigation';
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
