/// <reference types="../../types/jest" />
import './expect';
import { act, render, screen } from '@testing-library/react-native';
import React from 'react';
import { getMockConfig, getMockContext } from './mock-config';
import { setInitialUrl } from './mocks';
import { ExpoRoot } from '../ExpoRoot';
import getPathFromState from '../fork/getPathFromState';
import { stateCache } from '../getLinkingConfig';
import { store } from '../global-state/router-store';
import { router } from '../imperative-api';
// re-export everything
export * from '@testing-library/react-native';
export { getMockConfig, getMockContext };
export function renderRouter(context = './app', { initialUrl = '/', ...options } = {}) {
    const mockContext = getMockContext(context);
    // Reset the initial URL
    setInitialUrl(initialUrl);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    stateCache.clear();
    let location;
    if (typeof initialUrl === 'string') {
        location = new URL(initialUrl, 'test://');
    }
    else if (initialUrl instanceof URL) {
        location = initialUrl;
    }
    const result = render(<ExpoRoot context={mockContext} location={location}/>, {
        ...options,
    });
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