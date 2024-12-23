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
exports.renderRouter = exports.getMockContext = exports.getMockConfig = void 0;
require("./expect");
require("./mocks");
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const mock_config_1 = require("./mock-config");
Object.defineProperty(exports, "getMockConfig", { enumerable: true, get: function () { return mock_config_1.getMockConfig; } });
Object.defineProperty(exports, "getMockContext", { enumerable: true, get: function () { return mock_config_1.getMockContext; } });
const ExpoRoot_1 = require("../ExpoRoot");
const getPathFromState_1 = require("../fork/getPathFromState");
const router_store_1 = require("../global-state/router-store");
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
    /**
     * There maybe additional state updates that occur outside of the initial render cycle.
     * To avoid the user having to call `act` multiple times, we will just manually update the state here.
     */
    const updateRouterState = () => {
        if (router_store_1.store.navigationRef.isReady()) {
            const currentState = router_store_1.store.navigationRef.getRootState();
            if (router_store_1.store.rootState !== currentState) {
                router_store_1.store.updateState(currentState);
            }
        }
    };
    return Object.assign(result, {
        getPathname() {
            updateRouterState();
            return router_store_1.store.routeInfoSnapshot().pathname;
        },
        getSegments() {
            updateRouterState();
            return router_store_1.store.routeInfoSnapshot().segments;
        },
        getSearchParams() {
            updateRouterState();
            return router_store_1.store.routeInfoSnapshot().params;
        },
        getPathnameWithParams() {
            updateRouterState();
            return (0, getPathFromState_1.getPathFromState)(router_store_1.store.rootState, router_store_1.store.linking.config);
        },
        getRouterState() {
            updateRouterState();
            return router_store_1.store.rootStateSnapshot();
        },
    });
}
exports.renderRouter = renderRouter;
//# sourceMappingURL=index.js.map