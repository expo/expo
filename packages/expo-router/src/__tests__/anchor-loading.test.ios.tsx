import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { StrictMode, useEffect, useLayoutEffect } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../ExpoRoot';
import { navigationRef } from '../global-state/navigationRef';
import { router } from '../imperative-api';
import Stack from '../layouts/Stack';
import type { NavigationState } from '../react-navigation/routers';
import { renderRouter } from '../testing-library';
import { inMemoryContext, type MemoryContext } from '../testing-library/context-stubs';
import { TabList, TabSlot, TabTrigger, Tabs } from '../ui';
import { useNavigation } from '../useNavigation';

const originalImportMode = process.env.EXPO_ROUTER_IMPORT_MODE;

afterEach(() => {
  process.env.EXPO_ROUTER_IMPORT_MODE = originalImportMode;
  jest.restoreAllMocks();
});

// Counts how often each file is required, which is when its module would load.
function createProbeContext(files: MemoryContext) {
  const context = inMemoryContext(files);
  const requires: string[] = [];
  const probe = Object.assign(
    (id: string) => {
      requires.push(id);
      return context(id);
    },
    { keys: context.keys, resolve: context.resolve, id: context.id }
  );
  return {
    context: probe,
    requireCount: (file: string) => requires.filter((id) => id === `./${file}.js`).length,
  };
}

async function renderProbe(files: MemoryContext, location = '/') {
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  const probe = createProbeContext(files);
  await render(<ExpoRoot context={probe.context} location={location} />);
  return probe;
}

// The imperative router throws until the root has committed once.
function readRouterCanGoBack(): boolean | 'unavailable' {
  try {
    return router.canGoBack();
  } catch {
    return 'unavailable';
  }
}

// The root state is unavailable until the container has committed once.
function readProfileRouteNames(): string[] | undefined {
  const rootState = navigationRef.getRootState() as NavigationState | undefined;
  return rootState && getStateAt([0, 0]).routes.map((route) => route.name);
}

function getStateAt(path: number[]): NavigationState {
  let state = navigationRef.getRootState() as NavigationState;
  for (const index of path) {
    state = state.routes[index]!.state as NavigationState;
  }
  return state;
}

const nestedStackApp = {
  _layout: () => <Stack />,
  index: () => <Text testID="index">index</Text>,
  'profile/_layout': {
    unstable_settings: { anchor: 'index' },
    default: () => <Stack />,
  },
  'profile/index': () => <Text testID="profile">profile</Text>,
  'profile/[id]': () => <Text testID="profile-id">profile id</Text>,
  'other/_layout': {
    unstable_settings: { anchor: 'index' },
    default: () => <Stack />,
  },
  'other/index': () => <Text testID="other">other</Text>,
};

describe('loading', () => {
  it('does not require unvisited layouts on startup', async () => {
    const probe = await renderProbe(nestedStackApp);

    expect(screen.getByTestId('index')).toBeVisible();
    expect(probe.requireCount('_layout')).toBeGreaterThan(0);
    expect(probe.requireCount('profile/_layout')).toBe(0);
    expect(probe.requireCount('other/_layout')).toBe(0);
  });

  it('requires a layout when it first renders', async () => {
    const probe = await renderProbe(nestedStackApp);

    await act(() => router.push('/profile/1'));

    expect(screen.getByTestId('profile-id')).toBeVisible();
    expect(probe.requireCount('profile/_layout')).toBeGreaterThan(0);
    expect(probe.requireCount('other/_layout')).toBe(0);
  });
});

describe('initial deep link', () => {
  it('applies the anchor of a nested stack and goes back to it', async () => {
    await renderRouter(nestedStackApp, { initialUrl: '/profile/1' });

    expect(screen.getByTestId('profile-id')).toBeVisible();
    expect(getStateAt([0, 0]).routes.map((route) => route.name)).toEqual(['index', '[id]']);

    await act(() => router.back());

    expect(screen).toHavePathname('/profile');
    expect(screen.getByTestId('profile')).toBeVisible();
  });

  it('goes back to the anchor tab', async () => {
    await renderRouter(
      {
        '(tabs)/_layout': {
          unstable_settings: { anchor: 'b' },
          default: () => (
            <Tabs>
              <TabList>
                <TabTrigger name="a" href="/a" />
                <TabTrigger name="b" href="/b" />
              </TabList>
              <TabSlot />
            </Tabs>
          ),
        },
        '(tabs)/a': () => <Text testID="a">a</Text>,
        '(tabs)/b': () => <Text testID="b">b</Text>,
      },
      { initialUrl: '/a' }
    );

    expect(screen.getByTestId('a')).toBeVisible();

    await act(() => router.back());

    expect(screen).toHavePathname('/b');
  });

  it('commits the navigator state rendered on mount', async () => {
    const renderedStates: NavigationState[] = [];
    function Profile() {
      renderedStates.push(useNavigation().getState()!);
      return <Text testID="profile-id">profile id</Text>;
    }

    await renderRouter(
      { ...nestedStackApp, 'profile/[id]': Profile },
      { initialUrl: '/profile/1', wrapper: StrictMode }
    );

    const committedState = getStateAt([0, 0]);
    expect(committedState.routes.map((route) => route.name)).toEqual(['index', '[id]']);
    expect(renderedStates[0]).toStrictEqual(committedState);
    expect(renderedStates.at(-1)).toStrictEqual(committedState);
  });

  it('reports back navigation from the first render of the target screen', async () => {
    // Reading the root state before the container is ready logs an error.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const probes: Record<string, [boolean, boolean | 'unavailable', string[] | undefined]> = {};
    function Profile() {
      const navigation = useNavigation();
      const read = (): [boolean, boolean | 'unavailable', string[] | undefined] => [
        navigation.canGoBack(),
        readRouterCanGoBack(),
        readProfileRouteNames(),
      ];
      probes.render ??= read();
      useLayoutEffect(() => {
        probes.layoutEffect ??= read();
      }, []);
      useEffect(() => {
        probes.effect ??= read();
      }, []);
      return <Text testID="profile-id">profile id</Text>;
    }

    await renderRouter(
      { ...nestedStackApp, 'profile/[id]': Profile },
      { initialUrl: '/profile/1' }
    );

    // The navigator applies the anchor during render, so its own `canGoBack()` is right at once.
    // The store commits the anchor after the first commit, and the imperative router is
    // unavailable until the root has committed.
    expect(probes).toEqual({
      render: [true, 'unavailable', undefined],
      layoutEffect: [true, 'unavailable', undefined],
      effect: [true, 'unavailable', ['[id]']],
    });
    expect(router.canGoBack()).toBe(true);
    expect(getStateAt([0, 0]).routes.map((route) => route.name)).toEqual(['index', '[id]']);
  });

  it('goes back to the anchor when the target screen calls back on mount', async () => {
    function Profile() {
      const navigation = useNavigation();
      useEffect(() => {
        navigation.goBack();
      }, [navigation]);
      return <Text testID="profile-id">profile id</Text>;
    }

    await renderRouter(
      { ...nestedStackApp, 'profile/[id]': Profile },
      { initialUrl: '/profile/1' }
    );

    expect(screen).toHavePathname('/profile');
    expect(screen.getByTestId('profile')).toBeVisible();
  });
});

describe('nested anchor layouts', () => {
  it('goes back to the anchor of an anchor layout', async () => {
    await renderRouter(
      {
        _layout: {
          unstable_settings: { anchor: '(app)' },
          default: () => <Stack />,
        },
        '(app)/_layout': {
          unstable_settings: { anchor: 'b' },
          default: () => <Stack />,
        },
        '(app)/a': () => <Text testID="a">a</Text>,
        '(app)/b': () => <Text testID="b">b</Text>,
        modal: () => <Text testID="modal">modal</Text>,
      },
      { initialUrl: '/modal' }
    );

    expect(screen.getByTestId('modal')).toBeVisible();
    await act(() => router.back());

    expect(screen).toHavePathname('/b');
  });
});

describe('withAnchor', () => {
  it('cascades through two nested stacks', async () => {
    await renderRouter({
      _layout: () => <Stack />,
      index: () => <Text testID="index">index</Text>,
      'a/_layout': {
        unstable_settings: { anchor: 'index' },
        default: () => <Stack />,
      },
      'a/index': () => <Text testID="a">a</Text>,
      'a/b/_layout': {
        unstable_settings: { anchor: 'index' },
        default: () => <Stack />,
      },
      'a/b/index': () => <Text testID="b">b</Text>,
      'a/b/c': () => <Text testID="c">c</Text>,
    });

    await act(() => router.push('/a/b/c', { withAnchor: true }));
    expect(screen.getByTestId('c')).toBeVisible();

    await act(() => router.back());
    expect(screen).toHavePathname('/a/b');

    await act(() => router.back());
    expect(screen).toHavePathname('/a');

    await act(() => router.back());
    expect(screen).toHavePathname('/');
  });
});

describe('deprecated initialRouteName', () => {
  it('warns when the layout mounts', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await renderRouter({
      ...nestedStackApp,
      'profile/_layout': {
        unstable_settings: { initialRouteName: 'index' },
        default: () => <Stack />,
      },
    });

    const message =
      '`unstable_settings.initialRouteName` is deprecated. Use `unstable_settings.anchor` instead.';
    expect(warn).not.toHaveBeenCalledWith(message);

    await act(() => router.push('/profile/1', { withAnchor: true }));

    expect(warn).toHaveBeenCalledWith(message);
    await act(() => router.back());
    expect(screen).toHavePathname('/profile');
  });
});

describe('protected', () => {
  it('redirects a deep link to a guarded anchor', async () => {
    await renderRouter(
      {
        ...nestedStackApp,
        'profile/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Stack>
              <Stack.Protected guard={false}>
                <Stack.Screen name="index" />
              </Stack.Protected>
            </Stack>
          ),
        },
      },
      { initialUrl: '/profile/1' }
    );

    expect(screen.getByTestId('profile-id')).toBeVisible();
    expect(router.canGoBack()).toBe(false);
  });

  it('redirects a guarded deep link target to the anchor', async () => {
    await renderRouter(
      {
        ...nestedStackApp,
        'profile/_layout': {
          unstable_settings: { anchor: 'index' },
          default: () => (
            <Stack>
              <Stack.Protected guard={false}>
                <Stack.Screen name="[id]" />
              </Stack.Protected>
            </Stack>
          ),
        },
      },
      { initialUrl: '/profile/1' }
    );

    expect(screen).toHavePathname('/profile');
    expect(screen.getByTestId('profile')).toBeVisible();
  });
});

describe('headless tabs', () => {
  it('keeps the nested stack when switching back to a tab after its layout rendered', async () => {
    await renderRouter({
      _layout: () => (
        <Tabs>
          <TabList>
            <TabTrigger name="index" href="/" testID="goto-index" />
            <TabTrigger name="orange" href="/orange/color" testID="goto-orange" />
          </TabList>
          <TabSlot />
        </Tabs>
      ),
      index: () => <Text testID="index">index</Text>,
      'orange/_layout': {
        unstable_settings: { anchor: 'color' },
        default: () => <Stack />,
      },
      'orange/index': () => <Text testID="orange">orange</Text>,
      'orange/color': () => <Text testID="orange-color">orange color</Text>,
      'orange/shape': () => <Text testID="orange-shape">orange shape</Text>,
    });

    await fireEvent.press(screen.getByTestId('goto-orange'));
    expect(screen.getByTestId('orange-color')).toBeVisible();

    await act(() => router.push('/orange/shape'));
    await fireEvent.press(screen.getByTestId('goto-index'));
    expect(screen.getByTestId('index')).toBeVisible();

    await fireEvent.press(screen.getByTestId('goto-orange'));
    expect(screen).toHavePathname('/orange/shape');
  });

  it('keeps the nested stack when pressing the focused tab with an anchor href', async () => {
    await renderRouter(
      {
        _layout: () => (
          <Tabs>
            <TabList>
              <TabTrigger name="orange" href="/orange/color" testID="goto-orange" />
            </TabList>
            <TabSlot />
          </Tabs>
        ),
        'orange/_layout': {
          unstable_settings: { anchor: 'color' },
          default: () => <Stack />,
        },
        'orange/index': () => <Text testID="orange">orange</Text>,
        'orange/color': () => <Text testID="orange-color">orange color</Text>,
        'orange/shape': () => <Text testID="orange-shape">orange shape</Text>,
      },
      { initialUrl: '/orange/color' }
    );

    await act(() => router.push('/orange/shape'));
    await fireEvent.press(screen.getByTestId('goto-orange'));

    expect(screen).toHavePathname('/orange/shape');
  });
});
