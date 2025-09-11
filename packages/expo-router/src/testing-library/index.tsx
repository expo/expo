import './expect';
import './mocks';

import type { RenderResult } from '@testing-library/react-native';
import React from 'react';

import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { ReactNavigationState, store } from '../global-state/router-store';
import { router } from '../imperative-api';

const rnTestingLibrary = ((): typeof import('@testing-library/react-native') => {
  try {
    return require('@testing-library/react-native');
  } catch (error: any) {
    if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
      const newError = new Error(
        `[expo-router/testing-library] "@testing-library/react-native" failed to import. You need to install it to use expo-router's testing library.`
      );
      newError.stack = error.stack;
      newError.cause = error;
      throw newError;
    }
    throw error;
  }
})();

export type * from '@testing-library/react-native';

// TODO(@kitten): This is for backwards-compatibility. Consider removing this!
export declare const {
  act,
  cleanup,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
  within,
  configure,
  resetToDefaults,
  isHiddenFromAccessibility,
  isInaccessible,
  getDefaultNormalizer,
  renderHook,
  userEvent,
}: typeof rnTestingLibrary;

export declare let screen: typeof rnTestingLibrary.screen;

Object.assign(exports, rnTestingLibrary);
Object.defineProperty(exports, 'screen', {
  get() {
    return rnTestingLibrary.screen;
  },
});

export type RenderRouterOptions = Parameters<typeof rnTestingLibrary.render>[1] & {
  initialUrl?: any;
  linking?: Partial<ExpoLinkingOptions>;
};

type Result = ReturnType<typeof rnTestingLibrary.render> & {
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

  const result = rnTestingLibrary.render(
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
    rnTestingLibrary.act(() => router.navigate(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Push the provided pathname and assert the pathname */
  push(path: string) {
    rnTestingLibrary.act(() => router.push(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Replace with provided pathname and assert the pathname */
  replace(path: string) {
    rnTestingLibrary.act(() => router.replace(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Go back in history and asset the new pathname */
  back(path?: string) {
    expect(router.canGoBack()).toBe(true);
    rnTestingLibrary.act(() => router.back());
    if (path) {
      expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
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
    rnTestingLibrary.act(() => router.dismissAll());
  },
};
