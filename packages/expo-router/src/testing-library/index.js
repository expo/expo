import './expect';
import './mocks';
import React from 'react';
import { getMockConfig, getMockContext } from './mock-config';
import { ExpoRoot } from '../ExpoRoot';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
const rnTestingLibrary = (() => {
    try {
        return require('@testing-library/react-native');
    }
    catch (error) {
        if ('code' in error && error.code === 'MODULE_NOT_FOUND') {
            const newError = new Error(`[expo-router/testing-library] "@testing-library/react-native" failed to import. You need to install it to use expo-router's testing library.`);
            newError.stack = error.stack;
            newError.cause = error;
            throw newError;
        }
        throw error;
    }
})();
Object.assign(exports, rnTestingLibrary);
Object.defineProperty(exports, 'screen', {
    get() {
        return rnTestingLibrary.screen;
    },
});
export { getMockConfig, getMockContext };
export function renderRouter(context = './app', { initialUrl = '/', linking, ...options } = {}) {
    jest.useFakeTimers();
    const mockContext = getMockContext(context);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    const result = rnTestingLibrary.render(<ExpoRoot context={mockContext} location={initialUrl} linking={linking}/>, options);
    /**
     * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
     * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
     * (that the app will briefly be in the right state, but then update to an invalid state)
     */
    return Object.assign(result, {
        getPathname() {
            return store.getRouteInfo().pathname;
        },
        getSegments() {
            return store.getRouteInfo().segments;
        },
        getSearchParams() {
            return store.getRouteInfo().params;
        },
        getPathnameWithParams() {
            return store.getRouteInfo().pathnameWithParams;
        },
        getRouterState() {
            return store.state;
        },
    });
}
export const testRouter = {
    /** Navigate to the provided pathname and the pathname */
    navigate(path) {
        rnTestingLibrary.act(() => router.navigate(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Push the provided pathname and assert the pathname */
    push(path) {
        rnTestingLibrary.act(() => router.push(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Replace with provided pathname and assert the pathname */
    replace(path) {
        rnTestingLibrary.act(() => router.replace(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Go back in history and asset the new pathname */
    back(path) {
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
    setParams(params, path) {
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
//# sourceMappingURL=index.js.map