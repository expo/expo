import './expect';
import './mocks';

import { act, render, RenderResult, screen } from '@testing-library/react-native';
import React from 'react';

import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { ReactNavigationState, store } from '../global-state/router-store';
import { router } from '../imperative-api';

// re-export everything
export * from '@testing-library/react-native';

export type RenderRouterOptions = Parameters<typeof render>[1] & {
  initialUrl?: any;
  linking?: Partial<ExpoLinkingOptions>;
};

type Result = ReturnType<typeof render> & {
  getPathname(): string;
  getPathnameWithParams(): string;
  getSegments(): string[];
  getSearchParams(): Record<string, string | string[]>;
  getRouterState(): ReactNavigationState | undefined;
};

export { MockContextConfig, getMockConfig, getMockContext };

export function renderRouter(
  context: MockContextConfig = './app',
  { initialUrl = '/', linking, ...options }: RenderRouterOptions = {}
): Result {
  jest.useFakeTimers();

  const mockContext = getMockContext(context);

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

  const result = render(
    <ExpoRoot context={mockContext} location={initialUrl} linking={linking} />,
    options
  );

  /**
   * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
   * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
   * (that the app will briefly be in the right state, but then update to an invalid state)
   */
  return Object.assign(result, {
    getPathname(this: RenderResult): string {
      return store.getRouteInfo().pathname;
    },
    getSegments(this: RenderResult): string[] {
      return store.getRouteInfo().segments;
    },
    getSearchParams(this: RenderResult): Record<string, string | string[]> {
      return store.getRouteInfo().params;
    },
    getPathnameWithParams(this: RenderResult): string {
      return store.getRouteInfo().pathnameWithParams;
    },
    getRouterState(this: RenderResult) {
      return store.state;
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
  setParams(params: Record<string, string>, path?: string) {
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
