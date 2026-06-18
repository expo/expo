import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Route, type RouteNode } from '../../../Route';
import { stackRouter } from '../../routers';
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

// Proves the new tree drives REAL screens through the existing NativeStackView (Decisions R-2/R-13),
// under a live NavigationStateProvider, navigating via the router → dispatchNav. Not via renderRouter.

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
    <Route node={layoutNode} params={undefined}>
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

const commit = (action: Parameters<typeof stackRouter.getStateForAction>[1]) => {
  const root = getNavSnapshot()!.root;
  const next = stackRouter.getStateForAction(root, action);
  if (next) dispatchNav({ key: root.key, next, source: 'js' });
};

it('renders the focused screen from the tree through NativeStackView', () => {
  renderStack();
  expect(screen.getByText('IndexScreen')).toBeVisible();
});

it('a push commits to the store, moves focus, and mounts the new screen', () => {
  renderStack();
  act(() => commit({ type: 'navigate', target: { key: 'details#1', name: 'details' } }));
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['index', 'details']);
  expect(root.index).toBe(1);
  expect(screen.getByText('DetailsScreen')).toBeVisible();
});

it('a back removes the top route from committed state', () => {
  renderStack();
  act(() => commit({ type: 'navigate', target: { key: 'details#1', name: 'details' } }));
  act(() => commit({ type: 'goBack' }));
  const root = getNavSnapshot()!.root;
  expect(root.routes.map((r) => r.name)).toEqual(['index']);
  expect(root.index).toBe(0);
  expect(screen.queryByText('DetailsScreen')).toBeNull();
});

it('renders a NESTED navigator from a route child slice (the recursion seam)', () => {
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
        <Route node={innerLayout} params={undefined}>
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
      <Route node={layout} params={undefined}>
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
    const captured: {
      key: string;
      next: { routes: { name: string }[]; index: number };
      source: string;
    }[] = [];
    const shim = createStackNavigationShim('b#2', {
      node,
      dispatch: (c) => captured.push(c as never),
      emitter: createEmitter(),
    });
    return { shim, captured };
  };

  it('goBack commits the popped node (remove top, index--)', () => {
    const { shim, captured } = make();
    shim.goBack();
    expect(captured).toHaveLength(1);
    expect(captured[0]!.key).toBe('home.stack');
    expect(captured[0]!.next.routes.map((r) => r.name)).toEqual(['index', 'a']);
    expect(captured[0]!.next.index).toBe(1);
    expect(captured[0]!.source).toBe('js');
  });

  it('a native-origin POP(2) commits the popped node tagged native (P-6)', () => {
    const { shim, captured } = make();
    shim.dispatch({ type: 'POP', payload: { count: 2 }, source: 'b#2' });
    expect(captured[0]!.next.routes.map((r) => r.name)).toEqual(['index']);
    expect(captured[0]!.next.index).toBe(0);
    expect(captured[0]!.source).toBe('native');
  });

  it('isFocused and getState reflect the node', () => {
    const { shim } = make();
    expect(shim.isFocused()).toBe(true);
    expect(shim.getState().index).toBe(2);
    expect(shim.getState().routes.map((r) => r.name)).toEqual(['index', 'a', 'b']);
  });
});
