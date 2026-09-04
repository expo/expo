import { jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import { StrictMode, use, useEffect, useState, type ReactNode } from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../../ExpoRoot';
import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import { StackActions, type NavigationState } from '../../react-navigation/native';
import { getMockContext, renderRouter } from '../../testing-library';
import { navigationRef } from '../navigationRef';
import {
  RouterRegistryProvider,
  RouterRegistryContext,
  type RouterRegistryEntry,
  type RouterRegistryStore,
  useRegisterRouter,
} from '../routerRegistry';

const state: NavigationState = {
  stale: false,
  routeKeySeq: 0,
  type: 'stack',
  key: 'stack-key',
  index: 0,
  routeNames: ['index'],
  routes: [{ key: 'index-key', name: 'index' }],
};

const firstEntry: RouterRegistryEntry = {
  reduce: () => ({ state, affectedRouteKey: state.routes[state.index]?.key }),
};

const secondEntry: RouterRegistryEntry = {
  reduce: () => ({ state, affectedRouteKey: state.routes[state.index]?.key }),
};

function collectStateKeys(state: NavigationState): string[] {
  return [
    state.key,
    ...state.routes.flatMap((route) => [
      route.key,
      ...(route.state?.stale === false ? collectStateKeys(route.state) : []),
    ]),
  ];
}

function getLayoutState(): NavigationState {
  const layoutState = navigationRef.current!.getRootState().routes[0]!.state;

  if (layoutState?.stale !== false) {
    throw new Error('Expected initialized layout state');
  }

  return layoutState;
}

function Registrant({
  children,
  entry,
  stateKey = state.key,
}: {
  children?: ReactNode;
  entry: RouterRegistryEntry;
  stateKey?: string;
}) {
  useRegisterRouter(stateKey, entry);
  return children;
}

// The store is the context value, so this renders once. Read `getSnapshot()` after the commit
// rather than collecting a value per render.
function RegistryProbe({ onRender }: { onRender: (store: RouterRegistryStore) => void }) {
  const store = use(RouterRegistryContext);
  if (store === undefined) {
    throw new Error('Expected RouterRegistryProvider');
  }
  onRender(store);
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
    const stores: RouterRegistryStore[] = [];
    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );

    expect(stores.at(-1)?.getSnapshot().get(state.key)).toBe(firstEntry);

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
      </RouterRegistryProvider>
    );

    expect(stores.at(-1)?.getSnapshot().size).toBe(0);
  });

  it('keeps a newer registration when an older owner unmounts', () => {
    const stores: RouterRegistryStore[] = [];
    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(stores.at(-1)?.getSnapshot().get(state.key)).toBe(secondEntry);

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(stores.at(-1)?.getSnapshot().get(state.key)).toBe(secondEntry);
  });

  it('handles StrictMode effect replay', () => {
    const stores: RouterRegistryStore[] = [];

    render(
      <StrictMode>
        <RouterRegistryProvider>
          <RegistryProbe onRender={(store) => stores.push(store)} />
          <Registrant entry={firstEntry} />
        </RouterRegistryProvider>
      </StrictMode>
    );

    expect(stores.at(-1)?.getSnapshot().get(state.key)).toBe(firstEntry);
  });

  it('keeps one store identity for the life of the provider', () => {
    const stores: RouterRegistryStore[] = [];

    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );
    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(new Set(stores).size).toBe(1);
    expect(stores.at(-1)?.getSnapshot().get(state.key)).toBe(secondEntry);
  });

  it('replaces the snapshot instead of mutating it', () => {
    const stores: RouterRegistryStore[] = [];

    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );
    const store = stores.at(-1)!;
    const first = store.getSnapshot();

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(nextStore) => stores.push(nextStore)} />
        <Registrant entry={secondEntry} />
      </RouterRegistryProvider>
    );

    expect(store.getSnapshot()).not.toBe(first);
    // A snapshot taken earlier still reads what it read at the time.
    expect(first.get(state.key)).toBe(firstEntry);
    expect(store.getSnapshot().get(state.key)).toBe(secondEntry);
  });

  it('keeps the snapshot identity across a re-render', () => {
    const stores: RouterRegistryStore[] = [];

    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );
    const store = stores.at(-1)!;
    const first = store.getSnapshot();

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(nextStore) => stores.push(nextStore)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );

    expect(store.getSnapshot()).toBe(first);
  });

  it('notifies subscribers when a registration changes', () => {
    const listener = jest.fn();
    const stores: RouterRegistryStore[] = [];

    const result = render(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
      </RouterRegistryProvider>
    );
    const unsubscribe = stores.at(-1)!.subscribe(listener);

    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
        <Registrant entry={firstEntry} />
      </RouterRegistryProvider>
    );
    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    result.rerender(
      <RouterRegistryProvider>
        <RegistryProbe onRender={(store) => stores.push(store)} />
      </RouterRegistryProvider>
    );
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('navigation builder registration', () => {
  let store: RouterRegistryStore | undefined;
  let registryRenders: number;

  const getRegistry = () => store!.getSnapshot();

  function Probe() {
    const currentStore = use(RouterRegistryContext);
    if (currentStore === undefined) {
      throw new Error('Expected RouterRegistryProvider');
    }
    store = currentStore;
    registryRenders++;
    return <Text testID="probe" />;
  }

  beforeEach(() => {
    store = undefined;
    registryRenders = 0;
  });

  it('registers each mounted navigator by its state key', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
    });

    const rootState = navigationRef.current!.getRootState();
    const layoutState = rootState.routes[0]!.state!;

    expect([...getRegistry().keys()]).toEqual(
      expect.arrayContaining([rootState.key, layoutState.key])
    );
    expect(getRegistry().size).toBe(2);
  });

  it('registers an inactive nested navigator only after its screen mounts', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      'nested/_layout': () => <Stack />,
      'nested/index': () => <Text testID="nested" />,
    });

    expect(getRegistry().size).toBe(2);

    act(() => router.push('/nested'));

    expect(getRegistry().size).toBe(3);
  });

  it('reflects navigator mounts and unmounts in a new snapshot without re-rendering consumers', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      'nested/_layout': () => <Stack />,
      'nested/index': () => <Text testID="nested" />,
    });
    const initialStore = store;
    const initialSnapshot = getRegistry();
    const initialRenders = registryRenders;

    act(() => router.push('/nested'));
    expect(getRegistry().size).toBe(3);

    act(() => router.back());
    expect(getRegistry().size).toBe(2);
    // The snapshot is replaced, but the context value that carries it never is.
    expect(getRegistry()).not.toBe(initialSnapshot);
    expect(store).toBe(initialStore);
    expect(registryRenders).toBe(initialRenders);
  });

  it('reduces actions with the registered router configuration', () => {
    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
      second: () => <Text testID="second" />,
    });
    const layoutState = getLayoutState();
    const entry = getRegistry().get(layoutState.key)!;

    const result = entry.reduce(layoutState, StackActions.push('second'));

    expect(result?.state.routes.map((route) => route.name)).toEqual(['index', 'second']);
    expect(result?.affectedRouteKey).toBe(result?.state.routes[1]!.key);
  });

  it('preserves snapshot identity when screens do not change', () => {
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
    const initialRegistry = getRegistry();
    const initialEntry = getRegistry().get(getLayoutState().key);
    const initialRenders = registryRenders;

    act(() => rerenderLayout());

    expect(getRegistry()).toBe(initialRegistry);
    expect(getRegistry().get(getLayoutState().key)).toBe(initialEntry);
    expect(registryRenders).toBe(initialRenders);
  });

  it('keeps committed keys and screen instances stable across a StrictMode rerender', () => {
    let rerenderLayout: () => void;
    let mounts = 0;
    function Layout() {
      const [, setRenderCount] = useState(0);
      rerenderLayout = () => setRenderCount((count) => count + 1);
      return <Stack />;
    }
    function Screen() {
      useEffect(() => {
        mounts++;
      }, []);
      return <Text testID="screen" />;
    }
    const context = getMockContext({ _layout: Layout, index: Screen });

    render(
      <StrictMode>
        <ExpoRoot context={context} location="/" />
      </StrictMode>
    );
    const initialKeys = collectStateKeys(navigationRef.current!.getRootState());
    const initialMounts = mounts;

    act(() => rerenderLayout());

    expect(collectStateKeys(navigationRef.current!.getRootState())).toEqual(initialKeys);
    expect(mounts).toBe(initialMounts);
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
      const initialEntry = getRegistry().get(getLayoutState().key)!;

      routes.second = () => <Text testID="second" />;
      result.rerender(<ExpoRoot context={context} location="/" />);

      const updatedEntry = getRegistry().get(getLayoutState().key)!;
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
