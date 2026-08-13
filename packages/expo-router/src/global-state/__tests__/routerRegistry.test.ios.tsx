import { jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import { StrictMode, use, useState, type ReactNode } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../../ExpoRoot';
import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import { StackActions, type NavigationState } from '../../react-navigation/native';
import { getMockContext, renderRouter } from '../../testing-library';
import { store } from '../router-store';
import {
  RouterRegistryProvider,
  RouterRegistryContext,
  type RouterRegistry,
  type RouterRegistryEntry,
  useRegisterRouter,
} from '../routerRegistry';

const state: NavigationState = {
  stale: false,
  type: 'stack',
  key: 'stack-key',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index-key', name: 'index' }],
};

const firstEntry: RouterRegistryEntry = {
  reduce: () => ({ state, affectedRouteKey: state.routes[state.index]?.key }),
  routerType: 'stack',
};

const secondEntry: RouterRegistryEntry = {
  reduce: () => ({ state, affectedRouteKey: state.routes[state.index]?.key }),
  routerType: 'stack',
};

function getLayoutState(): NavigationState {
  const layoutState = store.navigationRef.current!.getRootState().routes[0]!.state;

  if (layoutState?.stale !== false) {
    throw new Error('Expected initialized layout state');
  }

  return layoutState;
}

function Registrant({
  entry,
  stateKey = state.key,
}: {
  entry: RouterRegistryEntry;
  stateKey?: string;
}) {
  useRegisterRouter(stateKey, entry);
  return null;
}

function RegistryProbe({ onRender }: { onRender: (registry: RouterRegistry) => void }) {
  const registry = use(RouterRegistryContext);
  if (registry === undefined) {
    throw new Error('Expected RouterRegistryProvider');
  }
  onRender(registry);
  return null;
}

describe(RouterRegistryProvider, () => {
  it('warns when registering outside the provider', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      render(<Registrant entry={firstEntry} />);

      expect(warn).toHaveBeenCalledWith(
        'Router registry is unavailable. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('registers and unregisters entries', () => {
    const registries: RouterRegistry[] = [];
    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(registry) => registries.push(registry)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );

    expect(registries.at(-1)?.get(state.key)).toBe(firstEntry);

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(registry) => registries.push(registry)} />
      </RouterRegistryProvider>
    );

    expect(registries.at(-1)?.size).toBe(0);
  });

  it('keeps a newer registration when an older owner unmounts', () => {
    const registries: RouterRegistry[] = [];
    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(registry) => registries.push(registry)} />
        <Registrant entry={firstEntry} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(registries.at(-1)?.get(state.key)).toBe(secondEntry);

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(registry) => registries.push(registry)} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(registries.at(-1)?.get(state.key)).toBe(secondEntry);
  });

  it('handles StrictMode effect replay', () => {
    const registries: RouterRegistry[] = [];

    render(
      <StrictMode>
        <RouterRegistryProvider>
          <RegistryProbe onRender={(registry) => registries.push(registry)} />
          <Registrant entry={firstEntry} />
        </RouterRegistryProvider>
      </StrictMode>
    );

    expect(registries.at(-1)?.get(state.key)).toBe(firstEntry);
  });

  it('preserves map identity when registration does not change', () => {
    const registries: RouterRegistry[] = [];

    render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(registry) => registries.push(registry)} />
        <Registrant entry={firstEntry} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );

    expect(new Set(registries).size).toBe(2);
    expect(registries.at(-1)?.get(state.key)).toBe(firstEntry);
  });
});

describe('navigation builder registration', () => {
  let registry: RouterRegistry;
  let registryRenders: number;

  function Probe() {
    const currentRegistry = use(RouterRegistryContext);
    if (currentRegistry === undefined) {
      throw new Error('Expected RouterRegistryProvider');
    }
    registry = currentRegistry;
    registryRenders++;
    return <Text testID="probe" />;
  }

  beforeEach(() => {
    registry = new Map();
    registryRenders = 0;
  });

  it('registers each mounted navigator by its state key', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
    });

    const rootState = store.navigationRef.current!.getRootState();
    const layoutState = rootState.routes[0]!.state!;

    expect([...registry.keys()]).toEqual(expect.arrayContaining([rootState.key, layoutState.key]));
    expect(registry.size).toBe(2);
  });

  it('registers an inactive nested navigator only after its screen mounts', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      'nested/_layout': () => <Stack />,
      'nested/index': () => <Text testID="nested" />,
    });

    expect(registry.size).toBe(2);

    act(() => router.push('/nested'));

    expect(registry.size).toBe(3);
  });

  it('notifies consumers when a navigator mounts and unmounts', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      'nested/_layout': () => <Stack />,
      'nested/index': () => <Text testID="nested" />,
    });
    const initialRenders = registryRenders;

    act(() => router.push('/nested'));
    expect(registryRenders).toBeGreaterThan(initialRenders);

    const mountedRenders = registryRenders;
    act(() => router.back());
    expect(registryRenders).toBeGreaterThan(mountedRenders);
    expect(registry.size).toBe(2);
  });

  it('reduces actions with the registered router configuration', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      second: () => <Text testID="second" />,
    });
    const layoutState = getLayoutState();
    const entry = registry.get(layoutState.key)!;

    const result = entry.reduce(layoutState, StackActions.push('second'));

    expect(result?.state.routes.map((route) => route.name)).toEqual(['index', 'second']);
    expect(result?.affectedRouteKey).toBe(result?.state.routes[1]!.key);
  });

  it('preserves registry identity when screens do not change', () => {
    let rerenderLayout: () => void;
    function Layout() {
      const [, setRenderCount] = useState(0);
      rerenderLayout = () => setRenderCount((count) => count + 1);
      return <Stack />;
    }

    renderRouter({
      _layout: Layout,
      index: Probe,
    });
    const initialRegistry = registry;
    const initialEntry = registry.get(getLayoutState().key);
    const initialRenders = registryRenders;

    act(() => rerenderLayout());

    expect(registry).toBe(initialRegistry);
    expect(registry.get(getLayoutState().key)).toBe(initialEntry);
    expect(registryRenders).toBe(initialRenders);
  });

  it('replaces the entry when screens change', () => {
    const routes: Record<string, () => ReactNode> = {
      _layout: () => <Stack />,
      index: Probe,
    };
    const context = getMockContext(routes);
    const previousImportMode = process.env.EXPO_ROUTER_IMPORT_MODE;
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

    try {
      const result = render(<ExpoRoot context={context} location="/" />);
      const initialEntry = registry.get(getLayoutState().key)!;

      routes.second = () => <Text testID="second" />;
      result.rerender(<ExpoRoot context={context} location="/" />);

      const updatedEntry = [...registry.values()].find((entry) => entry.contextKey === '')!;
      expect(updatedEntry).not.toBe(initialEntry);
      expect(
        updatedEntry.reduce(getLayoutState(), StackActions.push('second'))?.state.routes
      ).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'second' })]));
    } finally {
      if (previousImportMode === undefined) {
        delete process.env.EXPO_ROUTER_IMPORT_MODE;
      } else {
        process.env.EXPO_ROUTER_IMPORT_MODE = previousImportMode;
      }
    }
  });
});
