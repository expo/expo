import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { resolveBack } from '../back';
import { resolve } from '../behaviors';
import { dispatchNav, getNavSnapshot, NavigationStateProvider, useNavigationTree } from '../store';
import { ROOT_NAME } from '../tree';
import type { BehaviorLookup, GlobalNavState, NavNode } from '../types';

// Phase 4 — end-to-end proof of the root store + imperative bridge (RFC D12/D4, Decisions P-3/P-9).
//
// Proves: state in a root useReducer drives render; the imperative bridge dispatches from outside
// render and the committed snapshot mirrors what rendered; `back` resolves and commits.

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
  const tree = useNavigationTree();
  return <TreeView node={tree.root} />;
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

const lookup: BehaviorLookup = { [ROOT_NAME]: 'tabs', home: 'stack', search: 'stack' };

it('renders the focused path from a root useReducer', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  expect(screen.getByTestId('focused:root')).toHaveTextContent('home');
  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('index');
});

it('dispatches from outside render and the committed snapshot mirrors what rendered', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  const stackNode = initial.root.routes[0].child!;

  act(() => {
    dispatchNav({
      ops: resolve(
        { type: 'push', route: { key: 'details#9', name: 'details' } },
        stackNode,
        'stack'
      ),
      source: 'js',
    });
  });

  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('details');
  // Imperative read reflects committed state.
  const snap = getNavSnapshot()!;
  expect(snap.root.routes[0].child!.routes.map((r) => r.name)).toEqual(['index', 'details']);
});

it('back resolves from the snapshot and commits a tab refocus (scenario 6)', () => {
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  // Focus search first.
  act(() => {
    dispatchNav({ ops: [{ type: 'setIndex', target: 'root', index: 1 }], source: 'js' });
  });
  expect(screen.getByTestId('focused:root')).toHaveTextContent('search');
  expect(getNavSnapshot()!.root.index).toBe(1); // the imperative read sees COMMITTED state

  // Back resolves off the committed snapshot, bubbles to tabs, refocuses home.
  act(() => {
    const result = resolveBack(getNavSnapshot()!, lookup, ['home', 'search']);
    expect('ops' in result).toBe(true); // back actually resolved, not exit
    if ('ops' in result) dispatchNav({ ops: result.ops, source: 'js' });
  });
  expect(screen.getByTestId('focused:root')).toHaveTextContent('home');
});

it('re-installs the bridge after a remount', () => {
  const first = render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  first.unmount();
  render(
    <NavigationStateProvider initial={initial}>
      <Screen />
    </NavigationStateProvider>
  );
  expect(getNavSnapshot()).not.toBeNull();
  act(() => {
    dispatchNav({ ops: [{ type: 'setIndex', target: 'root', index: 1 }], source: 'js' });
  });
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
  expect(getNavSnapshot()).toBeNull(); // snapshot torn down
  expect(() => dispatchNav({ ops: [], source: 'js' })).toThrow('Navigation store is not mounted');
});
