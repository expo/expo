import { act, render, screen } from '@testing-library/react-native';
import { useReducer } from 'react';
import { Text } from 'react-native';

import { reduce, type NavCommit } from '../reducer';
import { stackRouter, tabsRouter } from '../routers';
import type { GlobalNavState, NavNode } from '../types';

// Isolated render harness (Decisions P-1 anti-cop-out guard): proves the homogeneous tree drives REAL
// React output, WITHOUT the shared renderRouter/store/ExpoRoot path. A minimal tree-driven navigator
// over a plain useReducer(reduce); a router computes the next node, the reducer swaps it in (R-13).

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

let dispatchRef: (commit: NavCommit) => void = () => {};

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

it('a stack push (router → commit) re-renders the new top', () => {
  render(<Harness initial={initial} />);
  const stackNode = initial.root.routes[0].child!;

  act(() => {
    const next = stackRouter.getStateForAction(stackNode, {
      type: 'navigate',
      target: { key: 'details#1', name: 'details' },
    })!;
    dispatchRef({ key: 'home.stack', next, source: 'js' });
  });

  expect(screen.getByTestId('focused:home.stack')).toHaveTextContent('details');
});

it('promoting an absent tab (the thesis) mounts and focuses its branch on screen', () => {
  render(<Harness initial={initial} />);
  expect(initial.root.routes.some((r) => r.name === 'search')).toBe(false); // precondition: absent
  expect(screen.queryByText('search')).toBeNull();

  act(() => {
    const next = tabsRouter.getStateForAction(initial.root, {
      type: 'navigate',
      target: {
        key: 'search#1',
        name: 'search',
        child: { key: 'search.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
      },
    })!;
    dispatchRef({ key: 'root', next, source: 'js' });
  });

  expect(screen.getByTestId('focused:root')).toHaveTextContent('search');
  expect(screen.getByTestId('focused:search.stack')).toHaveTextContent('index');
});
