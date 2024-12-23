import './expect';
import './mocks';

import { NavigationState, PartialState } from '@react-navigation/native';
import { render, RenderResult } from '@testing-library/react-native';
import React from 'react';

import { MockContextConfig, getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import { getPathFromState } from '../fork/getPathFromState';
import { ExpoLinkingOptions } from '../getLinkingConfig';
import { store } from '../global-state/router-store';
import { ResultState } from '../exports';

// re-export everything
export * from '@testing-library/react-native';

afterAll(() => {
  store.cleanup();
});

export type RenderRouterOptions = Parameters<typeof render>[1] & {
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

  const result = render(
    <ExpoRoot context={mockContext} location={initialUrl} linking={linking} />,
    options
  );

  /**
   * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
   * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
   * (that the app will briefly be in the right state, but then update to an invalid state)
   */
  store.subscribeToRootState(() => jest.runOnlyPendingTimers());

  /**
   * There maybe additional state updates that occur outside of the initial render cycle.
   * To avoid the user having to call `act` multiple times, we will just manually update the state here.
   */
  const updateRouterState = () => {
    if (store.navigationRef.isReady()) {
      const currentState = store.navigationRef.getRootState() as unknown as ResultState;
      if (store.rootState !== currentState) {
        store.updateState(currentState);
      }
    }
  };

  return Object.assign(result, {
    getPathname(this: RenderResult): string {
      updateRouterState();
      return store.routeInfoSnapshot().pathname;
    },
    getSegments(this: RenderResult): string[] {
      updateRouterState();
      return store.routeInfoSnapshot().segments;
    },
    getSearchParams(this: RenderResult): Record<string, string | string[]> {
      updateRouterState();
      return store.routeInfoSnapshot().params;
    },
    getPathnameWithParams(this: RenderResult): string {
      updateRouterState();
      return getPathFromState(store.rootState!, store.linking!.config);
    },
    getRouterState(this: RenderResult) {
      updateRouterState();
      return store.rootStateSnapshot();
    },
  });
}
