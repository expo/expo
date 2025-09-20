"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHook = renderHook;
exports.renderHookOnce = renderHookOnce;
const react_native_1 = require("@testing-library/react-native");
const react_1 = __importDefault(require("react"));
const context_stubs_1 = require("./context-stubs");
const ExpoRoot_1 = require("../ExpoRoot");
/*
 * Creates an Expo Router context around the hook, where every router renders the hook
 * This allows you full navigation
 */
function renderHook(renderCallback, routes = ['index'], { initialUrl = '/' } = {}) {
    return (0, react_native_1.renderHook)(renderCallback, {
        wrapper: function Wrapper({ children }) {
            const context = {};
            for (const key of routes) {
                context[key] = () => <>{children}</>;
            }
            return (<ExpoRoot_1.ExpoRoot context={(0, context_stubs_1.inMemoryContext)(context)} location={new URL(initialUrl, 'test://test')}/>);
        },
    });
}
function renderHookOnce(renderCallback, routes, options) {
    return renderHook(renderCallback, routes, options).result.current;
}
//# sourceMappingURL=hooks.js.map