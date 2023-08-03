/// <reference types="../../types/jest" />
import './expect';
import { render } from '@testing-library/react-native';
import path from 'path';
import React from 'react';
import { ExpoRoot } from '../ExpoRoot';
import { stateCache } from '../getLinkingConfig';
import { store } from '../global-state/router-store';
import { inMemoryContext, requireContext, requireContextWithOverrides, } from './context-stubs';
import { initialUrlRef } from './mocks';
// re-export everything
export * from '@testing-library/react-native';
function isOverrideContext(context) {
    return Boolean(typeof context === 'object' && 'appDir' in context);
}
export function renderRouter(context = './app', { initialUrl = '/', ...options } = {}) {
    jest.useFakeTimers();
    let ctx;
    // Reset the initial URL
    initialUrlRef.value = initialUrl;
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE_WEB = 'sync';
    process.env.EXPO_ROUTER_IMPORT_MODE_IOS = 'sync';
    process.env.EXPO_ROUTER_IMPORT_MODE_ANDROID = 'sync';
    if (typeof context === 'string') {
        ctx = requireContext(path.resolve(process.cwd(), context));
    }
    else if (isOverrideContext(context)) {
        ctx = requireContextWithOverrides(context.appDir, context.overrides);
    }
    else {
        ctx = inMemoryContext(context);
    }
    stateCache.clear();
    let location;
    if (typeof initialUrl === 'string') {
        location = new URL(initialUrl, 'test://');
    }
    else if (initialUrl instanceof URL) {
        location = initialUrl;
    }
    const result = render(React.createElement(ExpoRoot, { context: ctx, location: location }), {
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
    });
}
//# sourceMappingURL=index.js.map