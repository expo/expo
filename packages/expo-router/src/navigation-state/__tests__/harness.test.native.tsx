import { act, render, screen } from '@testing-library/react-native';
import { useReducer } from 'react';
import { Text } from 'react-native';

import { resolve } from '../behaviors';
import { reduce, type NavAction } from '../reducer';
import type { GlobalNavState, NavNode } from '../types';

// Phase 1b — isolated render harness (Decisions P-1 anti-cop-out guard).
//
// Proves the homogeneous tree drives REAL React output (not just JSON transforms), WITHOUT going
// through the shared `renderRouter`/`store`/`ExpoRoot` path — so the ~14 react-navigation-shape
// tests are untouched. This is a minimal tree-driven navigator over a plain `useReducer(reduce)`;
// the imperative bridge (module dispatch ref) is Phase 4.

/** A minimal homogeneous renderer: shows the focused route's name and recurses into its child. */
function TreeNavigator({ node }: { node: NavNode }) {
  const focused = node.routes[node.index];
  if (!focused) return null;
  return (
    <>
      <Text testID={`focused:${node.key}`}>{focused.name}</Text>
      {focused.child ? <TreeNavigator node={focused.child} /> : null}
    </>
  );
}

let dispatchRef: (action: NavAction) => void = () => {};

function Harness({ initial }: { initial: GlobalNavState }) {
  const [state, dispatch] = useReducer(reduce, initial);
  dispatchRef = dispatch;
  return <TreeNavigator node={state.root} />;
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
    ],
  },
};

afterEach(() => {
  dispatchRef = () => {};
});

it('renders the focused path from the tree', () => {
  render(<Harness initial={initial} />);
  expect(screen.getByTestId('focused:root')).toHaveTextContent('home');
  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('index');
});

it('a stack push resolves to ops, dispatches, and re-renders the new top', () => {
  render(<Harness initial={initial} />);
  const stackNode = initial.root.routes[0].child!;

  act(() => {
    dispatchRef({
      ops: resolve(
        { type: 'push', route: { key: 'details#1', name: 'details' } },
        stackNode,
        'stack'
      ),
      source: 'js',
    });
  });

  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('details');
});

it('promoting an absent tab (the thesis) mounts and focuses its branch on screen', () => {
  render(<Harness initial={initial} />);
  expect(initial.root.routes.some((r) => r.name === 'search')).toBe(false); // precondition: absent
  expect(screen.queryByText('search')).toBeNull();

  act(() => {
    dispatchRef({
      ops: resolve(
        {
          type: 'focus',
          route: {
            key: 'search#1',
            name: 'search',
            child: { key: 'search.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
          },
        },
        initial.root,
        'tabs'
      ),
      source: 'js',
    });
  });

  expect(screen.getByTestId('focused:root')).toHaveTextContent('search');
  expect(screen.getByTestId('focused:search.stack')).toHaveTextContent('index');
});
