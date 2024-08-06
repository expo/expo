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
require("./expect");
require("./mocks");
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const mock_config_1 = require("./mock-config");
Object.defineProperty(exports, "getMockConfig", { enumerable: true, get: function () { return mock_config_1.getMockConfig; } });
Object.defineProperty(exports, "getMockContext", { enumerable: true, get: function () { return mock_config_1.getMockContext; } });
const ExpoRoot_1 = require("../ExpoRoot");
const getPathFromState_1 = __importDefault(require("../fork/getPathFromState"));
const router_store_1 = require("../global-state/router-store");
const imperative_api_1 = require("../imperative-api");
// re-export everything
__exportStar(require("@testing-library/react-native"), exports);
afterAll(() => {
    router_store_1.store.cleanup();
});
function renderRouter(context = './app', { initialUrl = '/', linking, ...options } = {}) {
    jest.useFakeTimers();
    const mockContext = (0, mock_config_1.getMockContext)(context);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    const result = (0, react_native_1.render)(<ExpoRoot_1.ExpoRoot context={mockContext} location={initialUrl} linking={linking}/>, options);
    /**
     * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
     * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
     * (that the app will briefly be in the right state, but then update to an invalid state)
     */
    router_store_1.store.subscribeToRootState(() => jest.runOnlyPendingTimers());
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
        getRouterState() {
            return router_store_1.store.rootStateSnapshot();
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
    setParams(params, path) {
        imperative_api_1.router.setParams(params);
        if (path) {
            expect(react_native_1.screen).toHavePathnameWithParams(path);
        }
    },
    /** If there's history that supports invoking the `back` function. */
    dismissAll() {
        (0, react_native_1.act)(() => imperative_api_1.router.dismissAll());
    },
};
//# sourceMappingURL=index.js.map