"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testRouter = exports.getMockContext = exports.getMockConfig = void 0;
exports.renderRouter = renderRouter;
require("./expect");
require("./mocks");
const react_1 = __importDefault(require("react"));
const mock_config_1 = require("./mock-config");
Object.defineProperty(exports, "getMockConfig", { enumerable: true, get: function () { return mock_config_1.getMockConfig; } });
Object.defineProperty(exports, "getMockContext", { enumerable: true, get: function () { return mock_config_1.getMockContext; } });
const ExpoRoot_1 = require("../ExpoRoot");
const router_store_1 = require("../global-state/router-store");
const imperative_api_1 = require("../imperative-api");
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
function renderRouter(context = './app', { initialUrl = '/', linking, ...options } = {}) {
    jest.useFakeTimers();
    const mockContext = (0, mock_config_1.getMockContext)(context);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    const result = rnTestingLibrary.render(<ExpoRoot_1.ExpoRoot context={mockContext} location={initialUrl} linking={linking}/>, options);
    /**
     * This is a hack to ensure that React Navigation's state updates are processed before we run assertions.
     * Some updates are async and we need to wait for them to complete, otherwise will we get a false positive.
     * (that the app will briefly be in the right state, but then update to an invalid state)
     */
    return Object.assign(result, {
        getPathname() {
            return router_store_1.store.getRouteInfo().pathname;
        },
        getSegments() {
            return router_store_1.store.getRouteInfo().segments;
        },
        getSearchParams() {
            return router_store_1.store.getRouteInfo().params;
        },
        getPathnameWithParams() {
            return router_store_1.store.getRouteInfo().pathnameWithParams;
        },
        getRouterState() {
            return router_store_1.store.state;
        },
    });
}
exports.testRouter = {
    /** Navigate to the provided pathname and the pathname */
    navigate(path) {
        rnTestingLibrary.act(() => imperative_api_1.router.navigate(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Push the provided pathname and assert the pathname */
    push(path) {
        rnTestingLibrary.act(() => imperative_api_1.router.push(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Replace with provided pathname and assert the pathname */
    replace(path) {
        rnTestingLibrary.act(() => imperative_api_1.router.replace(path));
        expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
    },
    /** Go back in history and asset the new pathname */
    back(path) {
        expect(imperative_api_1.router.canGoBack()).toBe(true);
        rnTestingLibrary.act(() => imperative_api_1.router.back());
        if (path) {
            expect(rnTestingLibrary.screen).toHavePathnameWithParams(path);
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
            expect(exports.screen).toHavePathnameWithParams(path);
        }
    },
    /** If there's history that supports invoking the `back` function. */
    dismissAll() {
        rnTestingLibrary.act(() => imperative_api_1.router.dismissAll());
    },
};
//# sourceMappingURL=index.js.map