import { createContext, Fragment, use, useEffect, useState } from 'react';
import { TextInput } from 'react-native';
import type { NavigatorArgs } from 'standard-navigation';

import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import { StackRouter } from '../react-navigation/routers';
import { createStandardRouterNavigator } from '../standard-navigation';
import { act, fireEvent, renderRouter, screen } from '../testing-library';

// Feasibility probe for a replacement into a layout that has never rendered. The layout declares
// the guard, so the router cannot know that the destination is blocked before the layout renders.
// See the pull request description for the measured trade-off.

function Content(args: NavigatorArgs<object, Record<never, never>>) {
  return args.state.routes.map((route) => (
    <Fragment key={route.key}>{args.descriptors[route.key]!.render()}</Fragment>
  ));
}
const Stack = createStandardRouterNavigator(Content, StackRouter);
const AccessContext = createContext(false);

const settingsMount = jest.fn();
const settingsUnmount = jest.fn();
const areaMount = jest.fn();
const secretMount = jest.fn();
function Settings() {
  const [draft, setDraft] = useState('');
  useEffect(() => {
    settingsMount();
    return settingsUnmount;
  }, []);
  return <TextInput testID="settings" value={draft} onChangeText={setDraft} />;
}
function Area() {
  // The guard depends on React context that only this layout reads.
  const allowed = use(AccessContext);
  useEffect(() => {
    areaMount();
  }, []);
  return (
    <Stack>
      <Stack.Protected guard={allowed}>
        <Stack.Screen name="secret" />
      </Stack.Protected>
    </Stack>
  );
}
function Secret() {
  useEffect(() => {
    secretMount();
  }, []);
  return null;
}

afterEach(() => {
  settingsMount.mockReset();
  settingsUnmount.mockReset();
  areaMount.mockReset();
  secretMount.mockReset();
});

describe('replacement into a never-mounted layout', () => {
  it('loses Settings when the destination layout then denies access', async () => {
    await renderRouter({
      _layout: () => (
        <AccessContext value={false}>
          <Stack />
        </AccessContext>
      ),
      index: () => null,
      settings: Settings,
      'area/_layout': Area,
      'area/index': () => null,
      'area/secret': Secret,
    });
    await act(() => router.push('/settings'));
    await fireEvent.changeText(screen.getByTestId('settings'), 'typed');
    expect(screen.getByTestId('settings')).toHaveDisplayValue('typed');

    await act(() => router.replace('/area/secret'));

    const root = navigationRef.getRootState().routes[0]!.state!;
    expect(root.routes.map((route) => route.name)).toEqual(['index', 'area']);
    expect(root.routes[1]!.state!.routes.map((route) => route.name)).toEqual(['index']);
    expect(settingsMount).toHaveBeenCalledTimes(1);
    expect(settingsUnmount).toHaveBeenCalledTimes(1);
    expect(areaMount).toHaveBeenCalledTimes(1);
    expect(secretMount).not.toHaveBeenCalled();
  });

  // The contract requires this. It fails today; see the pull request description.
  it.failing(
    'keeps the original live Settings when the destination layout denies access',
    async () => {
      await renderRouter({
        _layout: () => (
          <AccessContext value={false}>
            <Stack />
          </AccessContext>
        ),
        index: () => null,
        settings: Settings,
        'area/_layout': Area,
        'area/index': () => null,
        'area/secret': Secret,
      });
      await act(() => router.push('/settings'));
      await fireEvent.changeText(screen.getByTestId('settings'), 'typed');
      const before = navigationRef.getRootState().routes[0]!.state!;

      await act(() => router.replace('/area/secret'));

      expect(navigationRef.getRootState().routes[0]!.state).toBe(before);
      expect(screen.getByTestId('settings')).toHaveDisplayValue('typed');
      expect(settingsUnmount).not.toHaveBeenCalled();
    }
  );

  it('opens one destination visit when the destination layout allows access', async () => {
    await renderRouter({
      _layout: () => (
        <AccessContext value>
          <Stack />
        </AccessContext>
      ),
      index: () => null,
      settings: Settings,
      'area/_layout': Area,
      'area/index': () => null,
      'area/secret': Secret,
    });
    await act(() => router.push('/settings'));

    await act(() => router.replace('/area/secret'));

    const root = navigationRef.getRootState().routes[0]!.state!;
    expect(root.routes.map((route) => route.name)).toEqual(['index', 'area']);
    expect(root.routes[1]!.state!.routes.map((route) => route.name)).toEqual(['secret']);
    expect(settingsUnmount).toHaveBeenCalledTimes(1);
    expect(areaMount).toHaveBeenCalledTimes(1);
    expect(secretMount).toHaveBeenCalledTimes(1);
  });

  it('keeps the later replacement when another one supersedes the blocked request', async () => {
    await renderRouter({
      _layout: () => (
        <AccessContext value={false}>
          <Stack />
        </AccessContext>
      ),
      index: () => null,
      settings: Settings,
      other: () => null,
      'area/_layout': Area,
      'area/index': () => null,
      'area/secret': Secret,
    });
    await act(() => router.push('/settings'));

    await act(() => {
      router.replace('/area/secret');
      router.replace('/other');
    });

    expect(
      navigationRef.getRootState().routes[0]!.state!.routes.map((route) => route.name)
    ).toEqual(['index', 'other']);
    expect(areaMount).not.toHaveBeenCalled();
    expect(secretMount).not.toHaveBeenCalled();
  });

  it('opens a second layout instance when the mounted instance is not focused', async () => {
    await renderRouter({
      _layout: () => (
        <AccessContext value={false}>
          <Stack />
        </AccessContext>
      ),
      index: () => null,
      settings: Settings,
      'area/_layout': Area,
      'area/index': () => null,
      'area/secret': Secret,
    });
    await act(() => router.push('/area'));
    await act(() => router.push('/settings'));

    await act(() => router.push('/area/secret'));

    const root = navigationRef.getRootState().routes[0]!.state!;
    // The guard of the unfocused Area is not consulted. The push opens a second Area, whose
    // guard then blocks Secret.
    expect(root.routes.map((route) => route.name)).toEqual(['index', 'area', 'settings', 'area']);
    expect(root.routes[3]!.state!.routes.map((route) => route.name)).toEqual(['index']);
    expect(settingsUnmount).not.toHaveBeenCalled();
    expect(areaMount).toHaveBeenCalledTimes(2);
    expect(secretMount).not.toHaveBeenCalled();
  });

  it('applies a redirect chain that enters the layout after the layout renders', async () => {
    await renderRouter({
      _layout: () => (
        <AccessContext value={false}>
          <Stack>
            <Stack.Protected guard={false} redirectTo="/area/secret">
              <Stack.Screen name="billing" />
            </Stack.Protected>
          </Stack>
        </AccessContext>
      ),
      index: () => null,
      settings: Settings,
      billing: () => null,
      'area/_layout': Area,
      'area/index': () => null,
      'area/secret': Secret,
    });
    await act(() => router.push('/settings'));

    await act(() => router.push('/billing'));

    const root = navigationRef.getRootState().routes[0]!.state!;
    expect(root.routes.map((route) => route.name)).toEqual(['index', 'settings', 'area']);
    expect(root.routes[2]!.state!.routes.map((route) => route.name)).toEqual(['index']);
    expect(areaMount).toHaveBeenCalledTimes(1);
    expect(secretMount).not.toHaveBeenCalled();
  });
});
