"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScreenPreload = useScreenPreload;
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const react_1 = require("react");
const Preview_1 = require("./Preview");
const hooks_1 = require("../../hooks");
const useNavigation_1 = require("../../useNavigation");
function useScreenPreload(href) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const router = (0, hooks_1.useRouter)();
    const [navigationKey, setNavigationKey] = (0, react_1.useState)();
    const { params, routeNode } = (0, react_1.useMemo)(() => (0, Preview_1.getParamsAndNodeFromHref)(href), [href]);
    // TODO: check if this can be done with listener to navigation state
    const updateNavigationKey = (0, react_1.useCallback)(() => {
        const state = getLeafState(navigation.getState());
        if (state?.type !== 'stack') {
            console.warn('Peek and Pop only supports stack navigators');
            return;
        }
        const castedState = state;
        const routeKey = castedState.preloadedRoutes?.find((r) => {
            // TODO: find out if this is correct solution. This is to cover cases of (.......)/index
            if (r.params && 'screen' in r.params && 'params' in r.params) {
                return r.params.screen === routeNode?.route && (0, fast_deep_equal_1.default)(r.params.params, params);
            }
            return r.name === routeNode?.route && (0, fast_deep_equal_1.default)(r.params, params);
        })?.key;
        setNavigationKey(routeKey);
    }, [params, routeNode]);
    const preload = (0, react_1.useCallback)(() => {
        router.prefetch(href);
    }, [href]);
    return {
        preload,
        updateNavigationKey,
        navigationKey,
    };
}
function getLeafState(state) {
    if (state && state.index !== undefined && state.routes[state.index]?.state) {
        return getLeafState(state.routes[state.index].state);
    }
    return state;
}
//# sourceMappingURL=hooks.js.map