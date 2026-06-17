import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Route, type RouteNode } from '../../../Route';
import { resolve } from '../../behaviors';
import {
  dispatchNav,
  getNavSnapshot,
  NavigationStateProvider,
  useNavigationTree,
} from '../../store';
import type { GlobalNavState } from '../../types';
import { Stack } from '../createStackNavigator';
import { createEmitter } from '../emitter';
import { NavNodeProvider } from '../navNodeContext';
import { createStackNavigationShim } from '../navigationShim';

// R-Phase B — proves the new tree drives REAL screens through the existing NativeStackView (Decisions
// R-2), under a live NavigationStateProvider, navigating via dispatchNav. Not via renderRouter (P-1).

const screenNode = (route: string, label: string): RouteNode => ({
  type: 'route',
  route,
  contextKey: `./${route}.tsx`,
  loadRoute: () => ({ default: () => <Text>{label}</Text> }),
  children: [],
  dynamic: null,
});

const layoutNode: RouteNode = {
  type: 'layout',
  route: '',
  contextKey: './_layout.tsx',
  loadRoute: () => ({ default: () => null }),
  children: [screenNode('index', 'IndexScreen'), screenNode('details', 'DetailsScreen')],
  dynamic: null,
};

const initial: GlobalNavState = {
  root: { key: 'home.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
};

function Root() {
  const tree = useNavigationTree();
  return (
    <Route node={layoutNode}>
      <NavNodeProvider node={tree.root}>
        <Stack />
      </NavNodeProvider>
    </Route>
  );
}

const renderStack = () =>
  render(
    <NavigationStateProvider initial={initial}>
      <Root />
    </NavigationStateProvider>
  );

const push = (name: string, key: string) =>
  dispatchNav({
    ops: resolve({ type: 'push', route: { key, name } }, getNavSnapshot()!.root, 'stack'),
    source: 'js',
  });

const back = () =>
  dispatchNav({ ops: resolve({ type: 'goBack' }, getNavSnapshot()!.root, 'stack'), source: 'js' });

it('renders the focused screen from the tree through NativeStackView', () => {
  renderStack();
  expect(screen.getByText('IndexScreen')).toBeVisible();
});

it('a push commits to the store, moves focus, and mounts the new screen', () => {
  renderStack();
  act(() => push('details', 'details#1'));
  // The real proof is the committed state, not just that the screen mounted (both stay mounted).
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['index', 'details']);
  expect(root.index).toBe(1);
  expect(screen.getByText('DetailsScreen')).toBeVisible();
});

it('a back removes the top route from committed state', () => {
  renderStack();
  act(() => push('details', 'details#1'));
  act(() => back());
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['index']);
  expect(root.index).toBe(0);
  expect(screen.queryByText('DetailsScreen')).toBeNull();
});

it('renders a NESTED navigator from a route`s child slice (the recursion seam)', () => {
  // home.stack focused on `details`, whose child is itself a stack showing `inner`.
  const innerLayout: RouteNode = {
    type: 'layout',
    route: 'details',
    contextKey: './details/_layout.tsx',
    loadRoute: () => ({ default: () => null }),
    children: [screenNode('inner', 'InnerScreen')],
    dynamic: null,
  };
  const detailsScreen: RouteNode = {
    ...screenNode('details', 'Details'),
    loadRoute: () => ({
      default: () => (
        <Route node={innerLayout}>
          <Stack />
        </Route>
      ),
    }),
  };
  const layout: RouteNode = {
    ...layoutNode,
    children: [screenNode('index', 'IndexScreen'), detailsScreen],
  };
  const nested: GlobalNavState = {
    root: {
      key: 'home.stack',
      index: 0,
      routes: [
        {
          key: 'details#0',
          name: 'details',
          child: { key: 'details.stack', index: 0, routes: [{ key: 'inner#0', name: 'inner' }] },
        },
      ],
    },
  };
  function NestedRoot() {
    const tree = useNavigationTree();
    return (
      <Route node={layout}>
        <NavNodeProvider node={tree.root}>
          <Stack />
        </NavNodeProvider>
      </Route>
    );
  }
  render(
    <NavigationStateProvider initial={nested}>
      <NestedRoot />
    </NavigationStateProvider>
  );
  expect(screen.getByText('InnerScreen')).toBeVisible();
});

describe('navigation shim', () => {
  const node = {
    key: 'home.stack',
    index: 2,
    routes: [
      { key: 'index#0', name: 'index' },
      { key: 'a#1', name: 'a' },
      { key: 'b#2', name: 'b' },
    ],
  };
  const make = () => {
    const captured: unknown[] = [];
    const shim = createStackNavigationShim('b#2', {
      node,
      dispatch: (a) => captured.push(a),
      emitter: createEmitter(),
    });
    return { shim, captured };
  };

  it('goBack routes a remove + index-- into the store', () => {
    const { shim, captured } = make();
    shim.goBack();
    expect(captured).toEqual([
      {
        ops: [
          { type: 'remove', target: 'home.stack', routeKeys: ['b#2'] },
          { type: 'setIndex', target: 'home.stack', index: 1 },
        ],
        source: 'js',
      },
    ]);
  });

  it('a native-origin dispatch (POP with source) tags the commit as native (P-6)', () => {
    const { shim, captured } = make();
    shim.dispatch({ type: 'POP', payload: { count: 2 }, source: 'b#2' });
    expect(captured).toEqual([
      {
        ops: [
          { type: 'remove', target: 'home.stack', routeKeys: ['a#1', 'b#2'] },
          { type: 'setIndex', target: 'home.stack', index: 0 },
        ],
        source: 'native',
      },
    ]);
  });

  it('isFocused and getState reflect the node', () => {
    const { shim } = make();
    expect(shim.isFocused()).toBe(true); // b#2 is focused (index 2)
    expect(shim.getState().index).toBe(2);
    expect(shim.getState().routes.map((r) => r.name)).toEqual(['index', 'a', 'b']);
  });
});
