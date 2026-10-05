import './expect';
import './mocks';
import type { RenderResult } from '@testing-library/react-native';

import { ExpoRoot } from '../ExpoRoot';
import type { ExpoLinkingOptions } from '../getLinkingConfig';
import { getRouteInfoFromState } from '../global-state/getRouteInfoFromState';
import { navigationRef } from '../global-state/navigationRef';
import type { ReactNavigationState } from '../global-state/types';
import { router } from '../imperative-api';
import { type MockContextConfig, getMockContext } from './mock-config';

export { type MockContextConfig, getMockConfig, getMockContext } from './mock-config';

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
  // userEvent,
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

export type RenderRouterResult = RenderResult & {
  getPathname(): string;
  getPathnameWithParams(): string;
  getSegments(): string[];
  getSearchParams(): Record<string, string | string[]>;
  getRouterState(): ReactNavigationState | undefined;
};

export async function renderRouter(
  context: MockContextConfig = './app',
  { initialUrl = '/', linking, ...options }: RenderRouterOptions = {}
): Promise<RenderRouterResult> {
  // See https://github.com/expo/expo/issues/46864 and https://github.com/expo/expo/pull/27648
  const systemTime = Date.now();
  jest.useFakeTimers();
  try {
    jest.setSystemTime(systemTime);
  } catch {
    // Legacy fake timers don't support `setSystemTime` (and don't mock the clock), so there's nothing to restore.
  }

  const mockContext = getMockContext(context);

  // Force the render to be synchronous
  process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';

  const result = await rnTestingLibrary.render(
    <ExpoRoot context={mockContext} location={initialUrl} linking={linking} />,
    options
  );

  return Object.assign(result, {
    getPathname(this: RenderResult): string {
      return getRouteInfoFromState(navigationRef.getRootState()).pathname;
    },
    getSegments(this: RenderResult): string[] {
      return getRouteInfoFromState(navigationRef.getRootState()).segments;
    },
    getSearchParams(this: RenderResult): Record<string, string | string[]> {
      return getRouteInfoFromState(navigationRef.getRootState()).params;
    },
    getPathnameWithParams(this: RenderResult): string {
      return getRouteInfoFromState(navigationRef.getRootState()).pathnameWithParams;
    },
    getRouterState(this: RenderResult) {
      return navigationRef.getRootState();
    },
  });
}

export const testRouter = {
  /** Navigate to the provided pathname and assert the pathname */
  async navigate(path: string) {
    await rnTestingLibrary.act(() => router.navigate(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Push the provided pathname and assert the pathname */
  async push(path: string) {
    await rnTestingLibrary.act(() => router.push(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Replace with provided pathname and assert the pathname */
  async replace(path: string) {
    await rnTestingLibrary.act(() => router.replace(path));
    expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
  },
  /** Go back in history and assert the new pathname */
  async back(path?: string) {
    expect(router.canGoBack()).toBe(true);
    await rnTestingLibrary.act(() => router.back());
    if (path) {
      expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    }
  },
  /** If there's history that supports invoking the `back` function. */
  canGoBack() {
    return router.canGoBack();
  },
  /** Update the current route query params and assert the new pathname */
  async setParams(params: Record<string, string>, path?: string) {
    await rnTestingLibrary.act(() => router.setParams(params));
    if (path) {
      expect(screen).toHavePathnameWithParams(path);
    }
  },
  /** Dismiss every screen in the current stack. */
  async dismissAll() {
    await rnTestingLibrary.act(() => router.dismissAll());
  },
};
