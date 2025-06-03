"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useScreenPreload = useScreenPreload;
const react_1 = require("react");
const contexts_1 = require("react-native-screens/src/contexts");
const Preview_1 = require("./Preview");
const hooks_1 = require("../../hooks");
const useNavigation_1 = require("../../useNavigation");
function useScreensRef() {
    return (0, react_1.use)(contexts_1.RNSScreensRefContext);
}
const areParamsEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function useScreenPreload(href) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const screensRef = useScreensRef();
    const router = (0, hooks_1.useRouter)();
    const { params, routeNode } = (0, react_1.useMemo)(() => (0, Preview_1.getParamsAndNodeFromHref)(href), [href]);
    const getNativeTag = (0, react_1.useCallback)(() => {
        const state = navigation.getState();
        if (state?.type !== 'stack') {
            console.warn('Peek and Pop only supports stack navigators');
            return;
        }
        const castedState = state;
        const routeKey = castedState.preloadedRoutes?.find((r) => r.name === routeNode?.route && areParamsEqual(r.params, params))?.key;
        return routeKey
            ? screensRef?.current[routeKey].current?.__nativeTag
            : undefined;
    }, [params, routeNode]);
    const preload = (0, react_1.useCallback)(() => {
        router.prefetch(href);
    }, [href]);
    return {
        preload,
        getNativeTag,
    };
}
//# sourceMappingURL=hooks.js.map