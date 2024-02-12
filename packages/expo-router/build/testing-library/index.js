"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRouter = exports.renderRouter = exports.getMockContext = exports.getMockConfig = void 0;
/// <reference types="../../types/jest" />
require("./expect");
const react_native_1 = require("@testing-library/react-native");
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const context_stubs_1 = require("./context-stubs");
const mocks_1 = require("./mocks");
const ExpoRoot_1 = require("../ExpoRoot");
const getPathFromState_1 = __importDefault(require("../fork/getPathFromState"));
const getLinkingConfig_1 = require("../getLinkingConfig");
const getRoutes_1 = require("../getRoutes");
const router_store_1 = require("../global-state/router-store");
const imperative_api_1 = require("../imperative-api");
// re-export everything
__exportStar(require("@testing-library/react-native"), exports);
function isOverrideContext(context) {
    return Boolean(typeof context === 'object' && 'appDir' in context);
}
function getMockConfig(context) {
    return (0, getLinkingConfig_1.getNavigationConfig)((0, getRoutes_1.getExactRoutes)(getMockContext(context)));
}
exports.getMockConfig = getMockConfig;
function getMockContext(context) {
    if (typeof context === 'string') {
        return (0, context_stubs_1.requireContext)(path_1.default.resolve(process.cwd(), context));
    }
    else if (Array.isArray(context)) {
        return (0, context_stubs_1.inMemoryContext)(Object.fromEntries(context.map((filename) => [filename, { default: () => null }])));
    }
    else if (isOverrideContext(context)) {
        return (0, context_stubs_1.requireContextWithOverrides)(context.appDir, context.overrides);
    }
    else {
        return (0, context_stubs_1.inMemoryContext)(context);
    }
}
exports.getMockContext = getMockContext;
function renderRouter(context = './app', { initialUrl = '/', ...options } = {}) {
    jest.useFakeTimers();
    const mockContext = getMockContext(context);
    // Reset the initial URL
    (0, mocks_1.setInitialUrl)(initialUrl);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    getLinkingConfig_1.stateCache.clear();
    let location;
    if (typeof initialUrl === 'string') {
        location = new URL(initialUrl, 'test://');
    }
    else if (initialUrl instanceof URL) {
        location = initialUrl;
    }
    const result = (0, react_native_1.render)(<ExpoRoot_1.ExpoRoot context={mockContext} location={location}/>, {
        ...options,
    });
    return Object.assign(result, {
        getPathname() {
            return router_store_1.store.routeInfoSnapshot().pathname;
        },
        getSegments() {
            return router_store_1.store.routeInfoSnapshot().segments;
        },
        getSearchParams() {
            return router_store_1.store.routeInfoSnapshot().params;
        },
        getPathnameWithParams() {
            return (0, getPathFromState_1.default)(router_store_1.store.rootState, router_store_1.store.linking.config);
        },
    });
}
exports.renderRouter = renderRouter;
exports.testRouter = {
    /** Navigate to the provided pathname and the pathname */
    navigate(path) {
        (0, react_native_1.act)(() => imperative_api_1.router.navigate(path));
        expect(react_native_1.screen).toHavePathnameWithParams(path);
    },
    /** Push the provided pathname and assert the pathname */
    push(path) {
        (0, react_native_1.act)(() => imperative_api_1.router.push(path));
        expect(react_native_1.screen).toHavePathnameWithParams(path);
    },
    /** Replace with provided pathname and assert the pathname */
    replace(path) {
        (0, react_native_1.act)(() => imperative_api_1.router.replace(path));
        expect(react_native_1.screen).toHavePathnameWithParams(path);
    },
    /** Go back in history and asset the new pathname */
    back(path) {
        expect(imperative_api_1.router.canGoBack()).toBe(true);
        (0, react_native_1.act)(() => imperative_api_1.router.back());
        if (path) {
            expect(react_native_1.screen).toHavePathnameWithParams(path);
        }
    },
    /** If there's history that supports invoking the `back` function. */
    canGoBack() {
        return imperative_api_1.router.canGoBack();
    },
    /** Update the current route query params and assert the new pathname */
    setParams(params) {
        imperative_api_1.router.setParams(params);
        if (path_1.default) {
            expect(react_native_1.screen).toHavePathnameWithParams(path_1.default);
        }
    },
};
//# sourceMappingURL=index.js.map