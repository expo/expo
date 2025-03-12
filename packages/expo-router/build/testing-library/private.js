"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderHookOnce = exports.renderHook = void 0;
const react_native_1 = require("@testing-library/react-native");
const ExpoRoot_1 = require("../ExpoRoot");
const context_stubs_1 = require("./context-stubs");
/**
 * These exports are not publicly available, but are used internally for testing
 */
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
exports.renderHook = renderHook;
function renderHookOnce(renderCallback, routes, options) {
    return renderHook(renderCallback, routes, options).result.current;
}
exports.renderHookOnce = renderHookOnce;
//# sourceMappingURL=private.js.map