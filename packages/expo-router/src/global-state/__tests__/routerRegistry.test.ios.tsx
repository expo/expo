import { jest } from '@jest/globals';
import { act, render } from '@testing-library/react-native';
import {
  StrictMode,
  use,
  useEffect,
  useState,
  type ContextType,
  type ReactNode,
  type RefObject,
} from 'react';
import { Text } from 'react-native';

import { ExpoRoot } from '../../ExpoRoot';
import { router } from '../../imperative-api';
import Stack from '../../layouts/Stack';
import { BaseNavigationContainer } from '../../react-navigation/core/__tests__/__fixtures__/BaseNavigationContainer';
import type {
  NavigationContainerRef,
  NavigationState,
  ParamListBase,
} from '../../react-navigation/native';
import { getMockContext } from '../../testing-library';
import { navigationRef } from '../navigationRef';
import {
  RouterRegistrySettersContext,
  type RouterRegistryEntry,
  useRegisterRouter,
} from '../routerRegistry';
import { node } from './__fixtures__/routeNode';

const firstEntry: RouterRegistryEntry = { reduce: () => null };

function Registrant({ entry }: { entry: RouterRegistryEntry }) {
  useRegisterRouter('root', entry);
  return null;
}

it('warns when registering outside the container', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  render(<Registrant entry={firstEntry} />);

  expect(warn).toHaveBeenCalledWith(
    'Router registry is unavailable. This is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.'
  );
  warn.mockRestore();
});

it('replaces entries and ignores stale-owner cleanup', () => {
  const ref = { current: null } as RefObject<NavigationContainerRef<ParamListBase> | null>;
  const firstReduce = jest.fn(() => null);
  const secondReduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index },
    affectedRouteKey: state.routes[state.index]?.key,
  }));
  const routeNode = node('root', [node('index')]);
  const first = { reduce: firstReduce, routeNode };
  const second = { reduce: secondReduce, routeNode };
  let setters = undefined as ContextType<typeof RouterRegistrySettersContext>;

  function CaptureSetters() {
    setters = use(RouterRegistrySettersContext);
    return null;
  }

  render(
    <BaseNavigationContainer
      ref={ref}
      initialState={{
        stale: false,
        routeKeySeq: 0,
        key: 'root',
        index: 1,
        routeNames: ['index', 'second'],
        routes: [
          { key: 'index', name: 'index' },
          { key: 'second', name: 'second' },
        ],
      }}>
      <CaptureSetters />
    </BaseNavigationContainer>
  );

  act(() => {
    setters!.register('root', first);
    setters!.register('root', first);
    setters!.register('root', second);
    setters!.unregister('root', first);
  });
  act(() => ref.current!.dispatchSync({ type: 'TEST' }));

  expect(firstReduce).not.toHaveBeenCalled();
  expect(secondReduce).toHaveBeenCalledTimes(1);
  expect(ref.current!.getRootState().routes).toEqual([
    { key: 'index', name: 'index' },
    { key: 'second', name: 'second' },
  ]);
});

it('does not rerender descendants when the registry changes', () => {
  let setters = undefined as ContextType<typeof RouterRegistrySettersContext>;
  const renders = jest.fn();
  const child = <Probe />;

  function Probe() {
    setters = use(RouterRegistrySettersContext);
    renders();
    return null;
  }

  render(<BaseNavigationContainer>{child}</BaseNavigationContainer>);
  const initialRenders = renders.mock.calls.length;

  act(() => setters!.register('root', firstEntry));

  expect(renders).toHaveBeenCalledTimes(initialRenders);
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

it('uses the latest screen config when screens change', () => {
  const routes: Record<string, () => ReactNode> = {
    _layout: () => <Stack />,
    index: () => <Text testID="index" />,
  };
  const context = getMockContext(routes);
  const previousImportMode = process.env.EXPO_ROUTER_IMPORT_MODE;
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

  try {
    const result = render(<ExpoRoot context={context} location="/" />);
    routes.second = () => <Text testID="second" />;
    result.rerender(<ExpoRoot context={context} location="/" />);

    act(() => router.push('/second'));

    expect(collectRouteNames(navigationRef.current!.getRootState())).toContain('second');
  } finally {
    if (previousImportMode === undefined) {
      delete process.env.EXPO_ROUTER_IMPORT_MODE;
    } else {
      process.env.EXPO_ROUTER_IMPORT_MODE = previousImportMode;
    }
  }
});

function collectStateKeys(
  state: ReturnType<NavigationContainerRef<ParamListBase>['getRootState']>
): string[] {
  return [
    state.key,
    ...state.routes.flatMap((route) => [
      route.key,
      ...(route.state?.stale === false ? collectStateKeys(route.state) : []),
    ]),
  ];
}

function collectRouteNames(
  state: ReturnType<NavigationContainerRef<ParamListBase>['getRootState']>
): string[] {
  return state.routes.flatMap((route) => [
    route.name,
    ...(route.state?.stale === false ? collectRouteNames(route.state) : []),
  ]);
}
