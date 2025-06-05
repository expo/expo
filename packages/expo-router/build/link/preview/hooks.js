"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScreenPreload = useScreenPreload;
const react_1 = require("react");
const react_native_screens_1 = require("react-native-screens");
const Preview_1 = require("./Preview");
const hooks_1 = require("../../hooks");
const useNavigation_1 = require("../../useNavigation");
function useScreensRef() {
    return (0, react_1.use)(react_native_screens_1.RNSScreensRefContext);
}
const areParamsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function useScreenPreload(href) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const screensRef = useScreensRef();
    const router = (0, hooks_1.useRouter)();
    const { params, routeNode } = (0, react_1.useMemo)(() => (0, Preview_1.getParamsAndNodeFromHref)(href), [href]);
    const isValid = !!screensRef;
    const getNativeTag = (0, react_1.useCallback)(() => {
        const state = getLeafState(navigation.getState());
        if (state?.type !== 'stack') {
            console.warn('Peek and Pop only supports stack navigators');
            return;
        }
        const castedState = state;
        const routeKey = castedState.preloadedRoutes?.find((r) => {
            // TODO: find out if this is correct solution. This is to cover cases of (.......)/index
            if (r.params && 'screen' in r.params) {
                return r.params.screen === routeNode?.route && areParamsEqual(r.params.params, params);
            }
            return r.name === routeNode?.route && areParamsEqual(r.params, params);
        })?.key;
        return routeKey
            ? screensRef?.current[routeKey]?.current?.__nativeTag
            : undefined;
    }, [params, routeNode]);
    const preload = (0, react_1.useCallback)(() => {
        router.prefetch(href);
    }, [href]);
    return {
        preload,
        getNativeTag,
        isValid,
    };
}
function getLeafState(state) {
    if (state && state.index !== undefined && state.routes[state.index]?.state) {
        return getLeafState(state.routes[state.index].state);
    }
    return state;
}
//# sourceMappingURL=hooks.js.map