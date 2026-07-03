import { act } from '@testing-library/react-native';
import { use } from 'react';

import {
  collectTabNavigatorKeys,
  NavigatorTypeContext,
  type NavigatorTypeContextValue,
} from '../NavigatorTypeContext';
import { store } from '../../../global-state/router-store';
import { router } from '../../../imperative-api';
import { Stack } from '../../../layouts/Stack';
import Tabs from '../../../layouts/Tabs';
import { TabRouter, type TabRouterOptions } from '../../native';
import { renderRouter, screen } from '../../../testing-library';
import { Navigator, Slot } from '../../../views/Navigator';

function chainToArray(node: NavigatorTypeContextValue | undefined): NavigatorTypeContextValue[] {
  const nodes: NavigatorTypeContextValue[] = [];
  while (node) {
    nodes.push(node);
    node = node.parent;
  }
  return nodes;
}

describe('NavigatorTypeContext chain', () => {
  it('the primary <Stack> announces itself as a stack with its state key', () => {
    let captured: NavigatorTypeContextValue | undefined;
    function Probe() {
      captured = use(NavigatorTypeContext);
      return null;
    }

    renderRouter({
      _layout: () => <Stack />,
      index: Probe,
    });

    const chain = chainToArray(captured);
    expect(chain).toHaveLength(1);
    expect(chain[0]!.type).toBe('stack');
    const rootStackKey = store.navigationRef.getRootState()!.routes[0]!.state!.key;
    expect(chain[0]!.stateKey).toBe(rootStackKey);
  });

  it('exposes the ancestor tab navigator with its real state key through a nested stack', () => {
    let captured: NavigatorTypeContextValue | undefined;
    function Probe() {
      captured = use(NavigatorTypeContext);
      return null;
    }

    renderRouter({
      _layout: () => <Tabs />,
      index: () => null,
      'faces/_layout': () => <Stack />,
      'faces/index': Probe,
    });

    act(() => router.navigate('/faces'));
    expect(screen).toHavePathname('/faces');

    const chain = chainToArray(captured);
    expect(chain).toHaveLength(2);
    expect(chain.map((node) => node.type)).toEqual(['stack', 'tab']);
    // The captured state key matches the live root tab navigator's key, so link-preview navigation
    // can look through this tab.
    const rootTabKey = store.navigationRef.getRootState()!.routes[0]!.state!.key;
    expect(chain[1]!.stateKey).toBe(rootTabKey);
  });

  it('links nested navigators into a parent chain with distinct state keys', () => {
    let captured: NavigatorTypeContextValue | undefined;
    function Probe() {
      captured = use(NavigatorTypeContext);
      return null;
    }

    renderRouter({
      _layout: () => <Tabs />,
      index: () => null,
      'faces/_layout': () => <Tabs />,
      'faces/index': () => null,
      'faces/deep/_layout': () => <Tabs />,
      'faces/deep/index': Probe,
    });

    act(() => router.navigate('/faces/deep'));

    const chain = chainToArray(captured);
    expect(chain).toHaveLength(3);
    expect(chain.map((node) => node.type)).toEqual(['tab', 'tab', 'tab']);

    // Keys are distinct navigators and the chain terminates at the root.
    const keys = chain.map((node) => node.stateKey);
    expect(new Set(keys).size).toBe(3);
    expect(chain[2]!.parent).toBeUndefined();
  });

  it('a custom navigator hides the ancestor kind from nearest reads but keeps the chain walkable', () => {
    let captured: NavigatorTypeContextValue | undefined;
    function Probe() {
      captured = use(NavigatorTypeContext);
      return null;
    }
    const customRouter = (options: TabRouterOptions) => TabRouter(options);

    renderRouter({
      _layout: () => <Tabs />,
      index: () => null,
      'home/_layout': () => (
        <Navigator router={customRouter}>
          <Probe />
          <Slot />
        </Navigator>
      ),
      'home/index': () => null,
    });

    act(() => router.navigate('/home'));

    const chain = chainToArray(captured);
    expect(chain).toHaveLength(2);
    // Nearest read must not report the ancestor tab's kind for the custom navigator's own state.
    expect(chain[0]!.type).toBeUndefined();
    expect(chain[1]!.type).toBe('tab');
    // The ancestor tab is still reachable for the look-through walk.
    const rootTabKey = store.navigationRef.getRootState()!.routes[0]!.state!.key;
    expect(collectTabNavigatorKeys(captured)).toEqual(new Set([rootTabKey]));
  });
});

describe(collectTabNavigatorKeys, () => {
  it('returns an empty set for an undefined chain', () => {
    expect(collectTabNavigatorKeys(undefined)).toEqual(new Set());
  });

  it('collects only the state keys of tab navigators along the chain', () => {
    // Chain (nearest first): stack -> tab -> stack -> tab.
    const chain: NavigatorTypeContextValue = {
      type: 'stack',
      stateKey: 'stack-leaf',
      parent: {
        type: 'tab',
        stateKey: 'tab-inner',
        parent: {
          type: 'stack',
          stateKey: 'stack-mid',
          parent: {
            type: 'tab',
            stateKey: 'tab-root',
            parent: undefined,
          },
        },
      },
    };

    expect(collectTabNavigatorKeys(chain)).toEqual(new Set(['tab-inner', 'tab-root']));
  });
});
