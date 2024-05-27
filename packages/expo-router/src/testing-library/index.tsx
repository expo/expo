import './expect';
import './mocks';

import { NavigationState, PartialState } from '@react-navigation/native';
import { act, render, RenderResult, screen } from '@testing-library/react-native';
import React from 'react';

import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import getPathFromState from '../fork/getPathFromState';
import { ExpoLinkingOptions, stateCache } from '../getLinkingConfig';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';

// re-export everything
export * from '@testing-library/react-native';

afterAll(() => {
  store.cleanup();
});

type RenderRouterOptions = Parameters<typeof render>[1] & {
  initialUrl?: any;
  linking?: Partial<ExpoLinkingOptions>;
};

type Result = ReturnType<typeof render> & {
  getPathname(): string;
  getPathnameWithParams(): string;
  getSegments(): string[];
  getSearchParams(): Record<string, string | string[]>;
  getRouterState(): NavigationState<any> | PartialState<any>;
};

declare global {
  namespace jest {
    interface Matchers<R> {
      toHavePathname(pathname: string): R;
      toHavePathnameWithParams(pathname: string): R;
      toHaveSegments(segments: string[]): R;
      toHaveSearchParams(params: Record<string, string | string[]>): R;
      toHaveRouterState(state: NavigationState<any> | PartialState<any>): R;
    }
  }
}

export { MockContextConfig, getMockConfig, getMockContext };

export function renderRouter(
  context: MockContextConfig = './app',
  { initialUrl = '/', linking, ...options }: RenderRouterOptions = {}
): Result {
  jest.useFakeTimers();

  const mockContext = getMockContext(context);

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
  stateCache.clear();

  const result = render(
    <ExpoRoot context={mockContext} location={initialUrl} linking={linking} />,
    options
  );

  return Object.assign(result, {
    getPathname(this: RenderResult): string {
      return store.routeInfoSnapshot().pathname;
    },
    getSegments(this: RenderResult): string[] {
      return store.routeInfoSnapshot().segments;
    },
    getSearchParams(this: RenderResult): Record<string, string | string[]> {
      return store.routeInfoSnapshot().params;
    },
    getPathnameWithParams(this: RenderResult): string {
      return getPathFromState(store.rootState!, store.linking!.config);
    },
    getRouterState(this: RenderResult) {
      return store.rootStateSnapshot();
    },
  });
}

export const testRouter = {
  /** Navigate to the provided pathname and the pathname */
  navigate(path: string) {
    act(() => router.navigate(path));
    expect(screen).toHavePathnameWithParams(path);
  },
  /** Push the provided pathname and assert the pathname */
  push(path: string) {
    act(() => router.push(path));
    expect(screen).toHavePathnameWithParams(path);
  },
  /** Replace with provided pathname and assert the pathname */
  replace(path: string) {
    act(() => router.replace(path));
    expect(screen).toHavePathnameWithParams(path);
  },
  /** Go back in history and asset the new pathname */
  back(path?: string) {
    expect(router.canGoBack()).toBe(true);
    act(() => router.back());
    if (path) {
      expect(screen).toHavePathnameWithParams(path);
    }
  },
  /** If there's history that supports invoking the `back` function. */
  canGoBack() {
    return router.canGoBack();
  },
  /** Update the current route query params and assert the new pathname */
  setParams(params?: Record<string, string>, path?: string) {
    router.setParams(params);
    if (path) {
      expect(screen).toHavePathnameWithParams(path);
    }
  },
  /** If there's history that supports invoking the `back` function. */
  dismissAll() {
    act(() => router.dismissAll());
  },
};
