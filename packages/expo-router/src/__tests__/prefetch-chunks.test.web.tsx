// Mock EXPO_ROUTER_IMPORT_MODE to 'lazy' before importing other modules
import { act, screen } from '@testing-library/react-native';
import React from 'react';

import { ExpoRoot } from '../ExpoRoot';
import { RouteNode } from '../Route';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
import { getMockContext, MockContextConfig } from '../testing-library/mock-config';
import {
  findRouteNodesForState,
  prefetchRouteComponent,
  __testing_getPrefetchedComponentCache,
} from '../useScreens';

// We need a custom renderRouter that doesn't override EXPO_ROUTER_IMPORT_MODE

jest.mock('../import-mode', () => ({ default: 'lazy' }));

const render = require('@testing-library/react-native').render;

function renderRouterLazy(context: MockContextConfig, initialUrl = '/') {
  jest.useFakeTimers();
  const mockContext = getMockContext(context);
  return render(<ExpoRoot context={mockContext} location={initialUrl} />);
}

describe('prefetch chunk loading (web + lazy)', () => {
  beforeEach(() => {
    __testing_getPrefetchedComponentCache().clear();
  });

  it('caches component on prefetchRouteComponent', async () => {
    const TestComponent = () => null;
    const mockNode = {
      loadRoute: jest.fn(() => Promise.resolve({ default: TestComponent })),
      route: 'test',
      children: [],
    } as unknown as RouteNode;

    expect(__testing_getPrefetchedComponentCache().has(mockNode)).toBe(false);

    await prefetchRouteComponent(mockNode);

    expect(mockNode.loadRoute).toHaveBeenCalledTimes(1);
    expect(__testing_getPrefetchedComponentCache().has(mockNode)).toBe(true);
    expect(__testing_getPrefetchedComponentCache().get(mockNode)).toBe(TestComponent);
  });

  it('does not call loadRoute twice for same node', async () => {
    const TestComponent = () => null;
    const mockNode = {
      loadRoute: jest.fn(() => Promise.resolve({ default: TestComponent })),
      route: 'test',
      children: [],
    } as unknown as RouteNode;

    await prefetchRouteComponent(mockNode);
    await prefetchRouteComponent(mockNode);

    expect(mockNode.loadRoute).toHaveBeenCalledTimes(1);
  });

  it('handles loadRoute errors gracefully', async () => {
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mockNode = {
      loadRoute: jest.fn(() => Promise.reject(new Error('Load failed'))),
      route: 'test',
      children: [],
    } as unknown as RouteNode;

    await prefetchRouteComponent(mockNode);

    expect(__testing_getPrefetchedComponentCache().has(mockNode)).toBe(false);
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to prefetch route'),
      expect.any(Error)
    );
    consoleWarn.mockRestore();
  });
});

describe('findRouteNodesForState', () => {
  it('skips __root and finds matching child nodes', () => {
    const childNode = {
      route: 'test',
      children: [],
    } as unknown as RouteNode;

    const rootNode = {
      route: '',
      children: [childNode],
    } as unknown as RouteNode;

    const state = {
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'test' }],
          },
        },
      ],
    };

    const nodes = findRouteNodesForState(rootNode, state as any);
    expect(nodes).toEqual([childNode]);
  });

  it('finds nested route nodes', () => {
    const leafNode = {
      route: 'page',
      children: [],
    } as unknown as RouteNode;

    const middleNode = {
      route: 'directory',
      children: [leafNode],
    } as unknown as RouteNode;

    const rootNode = {
      route: '',
      children: [middleNode],
    } as unknown as RouteNode;

    const state = {
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'directory',
                state: {
                  routes: [{ name: 'page' }],
                },
              },
            ],
          },
        },
      ],
    };

    const nodes = findRouteNodesForState(rootNode, state as any);
    expect(nodes).toEqual([middleNode, leafNode]);
  });

  it('handles group routes', () => {
    const indexNode = {
      route: '(tabs)/index',
      children: [],
    } as unknown as RouteNode;

    const rootNode = {
      route: '',
      children: [indexNode],
    } as unknown as RouteNode;

    const state = {
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: '(tabs)/index' }],
          },
        },
      ],
    };

    const nodes = findRouteNodesForState(rootNode, state as any);
    expect(nodes).toEqual([indexNode]);
  });

  it('returns empty array when no match found', () => {
    const rootNode = {
      route: '',
      children: [],
    } as unknown as RouteNode;

    const state = {
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'nonexistent' }],
          },
        },
      ],
    };

    const nodes = findRouteNodesForState(rootNode, state as any);
    expect(nodes).toEqual([]);
  });
});
