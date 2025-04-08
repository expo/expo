import './expect';
import './mocks';
import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import { getPathFromState } from '../fork/getPathFromState';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
// re-export everything
export * from '@testing-library/react-native';
afterAll(() => {
    store.cleanup();
});
export { getMockConfig, getMockContext };
export function renderRouter(context = './app', { initialUrl = '/', linking, ...options } = {}) {
    jest.useFakeTimers();
    const mockContext = getMockContext(context);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    const result = render(<ExpoRoot context={mockContext} location={initialUrl} linking={linking}/>, options);
    /**
     * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
     * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
     * (that the app will briefly be in the right state, but then update to an invalid state)
     */
    store.subscribeToRootState(() => jest.runOnlyPendingTimers());
    return Object.assign(result, {
        getPathname() {
            return store.routeInfoSnapshot().pathname;
        },
        getSegments() {
            return store.routeInfoSnapshot().segments;
        },
        getSearchParams() {
            return store.routeInfoSnapshot().params;
        },
        getPathnameWithParams() {
            return getPathFromState(store.rootState, store.linking.config);
        },
        getRouterState() {
            return store.rootStateSnapshot();
        },
    });
}
export const testRouter = {
    /** Navigate to the provided pathname and the pathname */
    navigate(path) {
        act(() => router.navigate(path));
        expect(screen).toHavePathnameWithParams(path);
    },
    /** Push the provided pathname and assert the pathname */
    push(path) {
        act(() => router.push(path));
        expect(screen).toHavePathnameWithParams(path);
    },
    /** Replace with provided pathname and assert the pathname */
    replace(path) {
        act(() => router.replace(path));
        expect(screen).toHavePathnameWithParams(path);
    },
    /** Go back in history and asset the new pathname */
    back(path) {
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
    setParams(params, path) {
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
//# sourceMappingURL=index.js.map