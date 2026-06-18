import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { resolveBack } from '../back';
import { __resetRouterRegistryForTests, registerRouter } from '../routerRegistry';
import { stackRouter, tabsRouter } from '../routers';
import { dispatchNav, getNavSnapshot, NavigationStateProvider, useNavigationTree } from '../store';
import type { GlobalNavState, NavNode } from '../types';

// End-to-end proof of the root store + imperative bridge (RFC D12/D4, Decisions R-13): state in a root
// useReducer drives render; the bridge commits node swaps from outside render; the committed snapshot
// mirrors what rendered; back resolves via the router registry.

function TreeView({ node }: { node: NavNode }) {
  const focused = node.routes[node.index];
  if (!focused) return null;
  return (
    <>
      <Text testID={`focused:${node.key}`}>{focused.name}</Text>
      {focused.child ? <TreeView node={focused.child} /> : null}
    </>
  );
}

function Screen() {
  return <TreeView node={useNavigationTree().root} />;
}

const initial: GlobalNavState = {
  root: {
    key: 'root',
    index: 0,
    routes: [
      {
        key: 'home#0',
        name: 'home',
        child: { key: 'home.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
      },
      {
        key: 'search#1',
        name: 'search',
        child: { key: 'search.stack', index: 0, routes: [{ key: 'index#1', name: 'index' }] },
      },
    ],
  },
};

const focusSearch = () =>
  dispatchNav({ key: 'root', next: { ...initial.root, index: 1 }, source: 'js' });

afterEach(__resetRouterRegistryForTests);

it('renders the focused path from a root useReducer', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  expect(screen.getByTestId('focused:root')).toHaveTextContent('home');
  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('index');
});

it('commits a node swap from outside render; the snapshot mirrors what rendered', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  const stackNode = initial.root.routes[0]!.child!;

  act(() => {
    const next = stackRouter.getStateForAction(stackNode, {
      type: 'navigate',
      target: { key: 'details#9', name: 'details' },
    })!;
    dispatchNav({ key: 'home.stack', next, source: 'js' });
  });

  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('details');
  expect(getNavSnapshot()!.root.routes[0]!.child!.routes.map((r) => r.name)).toEqual([
    'index',
    'details',
  ]);
});

it('back resolves from the snapshot via the registry and commits a tab refocus (scenario 6)', () => {
  registerRouter('root', tabsRouter);
  registerRouter('home.stack', stackRouter);
  registerRouter('search.stack', stackRouter);
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  act(focusSearch);
  expect(screen.getByTestId('focused:root')).toHaveTextContent('search');
  expect(getNavSnapshot()!.root.index).toBe(1); // imperative read sees COMMITTED state

  act(() => {
    const result = resolveBack(getNavSnapshot()!, ['home', 'search']);
    expect('key' in result).toBe(true); // resolved, not exit
    if ('key' in result) dispatchNav({ key: result.key, next: result.next, source: 'js' });
  });
  expect(screen.getByTestId('focused:root')).toHaveTextContent('home');
});

it('re-installs the bridge after a remount', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  ).unmount();
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  expect(getNavSnapshot()).not.toBeNull();
  act(focusSearch);
  expect(screen.getByTestId('focused:root')).toHaveTextContent('search');
});

it('useNavigationTree throws outside a provider', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<Screen />)).toThrow('must be used within a NavigationStateProvider');
  spy.mockRestore();
});

it('throws when dispatching with no provider mounted', () => {
  const { unmount } = render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  unmount();
  expect(getNavSnapshot()).toBeNull();
  expect(() => dispatchNav({ key: 'root', next: initial.root, source: 'js' })).toThrow(
    'Navigation store is not mounted'
  );
});
