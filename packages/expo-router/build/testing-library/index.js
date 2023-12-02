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
exports.renderRouter = void 0;
/// <reference types="../../types/jest" />
require("./expect");
const react_native_1 = require("@testing-library/react-native");
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const context_stubs_1 = require("./context-stubs");
const mocks_1 = require("./mocks");
const ExpoRoot_1 = require("../ExpoRoot");
const getLinkingConfig_1 = require("../getLinkingConfig");
const router_store_1 = require("../global-state/router-store");
// re-export everything
__exportStar(require("@testing-library/react-native"), exports);
function isOverrideContext(context) {
    return Boolean(typeof context === 'object' && 'appDir' in context);
}
function renderRouter(context = './app', { initialUrl = '/', ...options } = {}) {
    jest.useFakeTimers();
    let ctx;
    // Reset the initial URL
    (0, mocks_1.setInitialUrl)(initialUrl);
    // Force the render to be synchronous
    process.env.EXPO_ROUTER_IMPORT_MODE = 'sync';
    if (typeof context === 'string') {
        ctx = (0, context_stubs_1.requireContext)(path_1.default.resolve(process.cwd(), context));
    }
    else if (isOverrideContext(context)) {
        ctx = (0, context_stubs_1.requireContextWithOverrides)(context.appDir, context.overrides);
    }
    else {
        ctx = (0, context_stubs_1.inMemoryContext)(context);
    }
    getLinkingConfig_1.stateCache.clear();
    let location;
    if (typeof initialUrl === 'string') {
        location = new URL(initialUrl, 'test://');
    }
    else if (initialUrl instanceof URL) {
        location = initialUrl;
    }
    const result = (0, react_native_1.render)(<ExpoRoot_1.ExpoRoot context={ctx} location={location}/>, {
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
    });
}
exports.renderRouter = renderRouter;
//# sourceMappingURL=index.js.map