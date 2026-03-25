import 'react-native-gesture-handler/jestSetup';

import { describe, expect, test } from '@jest/globals';
import * as React from 'react';

import type { ParamListBase, Route, StackNavigationState } from '../../../../native';
import type { StackDescriptorMap } from '../../../types';
import { StackView } from '../StackView';

type State = Parameters<typeof StackView.getDerivedStateFromProps>[1];

const createRoute = (name: string, key?: string): Route<string> => ({
  name,
  key: key ?? name,
});

const createNavigationState = (
  routes: Route<string>[],
  options: { index?: number; preloadedRoutes?: Route<string>[] } = {}
): StackNavigationState<ParamListBase> => ({
  stale: false,
  type: 'stack',
  key: 'stack-1',
  index: options.index ?? routes.length - 1,
  routeNames: routes.map((r) => r.name),
  routes,
  preloadedRoutes: options.preloadedRoutes ?? [],
});

const createDescriptors = (
  routes: Route<string>[],
  options: { animation?: 'default' | 'none' } = {}
): StackDescriptorMap => {
  const descriptors: StackDescriptorMap = {};
  for (const route of routes) {
    descriptors[route.key] = {
      route,
      options: {
        animation: options.animation ?? 'default',
      },
      navigation: {} as any,
      render: () => <></>,
    };
  }
  return descriptors;
};

const createProps = (
  routes: Route<string>[],
  options: {
    index?: number;
    preloadedRoutes?: Route<string>[];
    animation?: 'default' | 'none';
  } = {}
) => ({
  state: createNavigationState(routes, options),
  descriptors: createDescriptors(routes, options),
  direction: 'ltr' as const,
  navigation: {} as any,
  describe: (() => {}) as any,
});

const createState = (overrides: Partial<State> = {}, routes: Route<string>[] = []): State => ({
  routes,
  previousState: undefined,
  previousDescriptors: {},
  openingRouteKeys: [],
  closingRouteKeys: [],
  replacingRouteKeys: [],
  descriptors: {},
  ...overrides,
});

describe('StackView.getDerivedStateFromProps', () => {
  describe('initial render', () => {
    test('sets up initial state with routes (no animation on first render)', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA, routeB]);
      const state = createState();

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);

      expect(result.openingRouteKeys).toEqual([]);
      expect(result.closingRouteKeys).toEqual([]);
      expect(result.replacingRouteKeys).toEqual([]);
    });
  });

  describe('push navigation', () => {
    test('adds new route to opening list', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA, routeB]);
      const state = createState(
        {
          previousState: createNavigationState([routeA]),
          openingRouteKeys: [],
        },
        [routeA]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
      expect(result.openingRouteKeys).toEqual(['B']);
      expect(result.closingRouteKeys).toEqual([]);
    });
  });

  describe('pop navigation', () => {
    test('adds removed route to closing list and keeps it in routes', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA]);
      const state = createState(
        {
          previousState: createNavigationState([routeA, routeB]),
          openingRouteKeys: [],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
      expect(result.closingRouteKeys).toEqual(['B']);
      expect(result.openingRouteKeys).toEqual([]);
    });
  });

  describe('replace navigation (push animation)', () => {
    test('adds old route to replacing list and keeps it in routes', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeB]);
      const state = createState(
        {
          previousState: createNavigationState([routeA]),
          openingRouteKeys: [],
        },
        [routeA]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
      expect(result.replacingRouteKeys).toEqual(['A']);
      expect(result.openingRouteKeys).toEqual(['B']);
    });

    test('preserves replacing routes during chained replaces (A→B→C)', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const routeC = createRoute('C');
      const props = createProps([routeC]);
      const state = createState(
        {
          previousState: createNavigationState([routeB]),
          replacingRouteKeys: ['A'],
          openingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B', 'C']);
      expect(result.replacingRouteKeys).toEqual(['A', 'B']);
      expect(result.openingRouteKeys).toEqual(['C']);
    });
  });

  describe('early return path (no route key changes)', () => {
    test('preserves animation routes when descriptors change during animation', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');

      const oldDescriptors = createDescriptors([routeA, routeB]);
      const newDescriptors = createDescriptors([routeA, routeB]);

      const props = {
        ...createProps([routeB]),
        descriptors: newDescriptors,
      };

      const state = createState(
        {
          previousState: createNavigationState([routeB]),
          previousDescriptors: oldDescriptors,
          replacingRouteKeys: ['A'],
          openingRouteKeys: ['B'],
          descriptors: {
            ...oldDescriptors,
            [routeA.key]: oldDescriptors[routeA.key],
          },
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
    });

    test('preserves closing routes during re-render', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');

      const props = createProps([routeA]);
      const state = createState(
        {
          previousState: createNavigationState([routeA]),
          closingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
    });

    test('preserves replacing routes during re-render', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');

      const props = createProps([routeB]);
      const state = createState(
        {
          previousState: createNavigationState([routeB]),
          replacingRouteKeys: ['A'],
          openingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
    });

    test('updates route objects while preserving animation routes', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const updatedRouteB = { ...routeB, params: { updated: true } };

      const props = createProps([updatedRouteB]);
      const state = createState(
        {
          previousState: createNavigationState([routeB]),
          replacingRouteKeys: ['A'],
          openingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A', 'B']);
      const resultRouteB = result.routes.find((r) => r.key === 'B');
      expect(resultRouteB).toEqual(updatedRouteB);
    });
  });

  describe('animation disabled', () => {
    test('does not add route to closing list when animation is disabled', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA], { animation: 'none' });
      const state = createState(
        {
          previousState: createNavigationState([routeA, routeB]),
          openingRouteKeys: [],
          descriptors: createDescriptors([routeA, routeB], {
            animation: 'none',
          }),
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['A']);
      expect(result.closingRouteKeys).toEqual([]);
    });

    test('does not add route to replacing list when animation is disabled', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeB], { animation: 'none' });
      const state = createState(
        {
          previousState: createNavigationState([routeA]),
          openingRouteKeys: [],
          descriptors: createDescriptors([routeA], { animation: 'none' }),
        },
        [routeA]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['B']);
      expect(result.replacingRouteKeys).toEqual([]);
      expect(result.openingRouteKeys).toEqual([]);
    });
  });

  describe('edge cases', () => {
    test('handles route closing before opening animation finishes', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA]);
      const state = createState(
        {
          previousState: createNavigationState([routeA, routeB]),
          openingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.closingRouteKeys).toEqual(['B']);
      expect(result.openingRouteKeys).toEqual([]);
    });

    test('removes route from replacing list when it becomes the focused route again', () => {
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeA]);
      const state = createState(
        {
          previousState: createNavigationState([routeB]),
          replacingRouteKeys: ['A'],
          openingRouteKeys: ['B'],
        },
        [routeA, routeB]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.replacingRouteKeys).not.toContain('A');
    });

    test('handles multiple routes in stack with replace on top', () => {
      const routeX = createRoute('X');
      const routeA = createRoute('A');
      const routeB = createRoute('B');
      const props = createProps([routeX, routeB]);
      const state = createState(
        {
          previousState: createNavigationState([routeX, routeA]),
          openingRouteKeys: [],
        },
        [routeX, routeA]
      );

      const result = StackView.getDerivedStateFromProps(props, state);

      expect(result.routes.map((r) => r.key)).toEqual(['X', 'A', 'B']);
      expect(result.replacingRouteKeys).toEqual(['A']);
      expect(result.openingRouteKeys).toEqual(['B']);
    });
  });
});
