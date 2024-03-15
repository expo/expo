"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOptionalNavigation = exports.useLoadedNavigation = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const router_store_1 = require("../global-state/router-store");
/** Returns a callback which is invoked when the navigation state has loaded. */
function useLoadedNavigation() {
    const { navigationRef } = (0, router_store_1.useExpoRouter)();
    const navigation = (0, native_1.useNavigation)();
    const isMounted = (0, react_1.useRef)(true);
    const pending = (0, react_1.useRef)([]);
    (0, react_1.useEffect)(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);
    const flush = (0, react_1.useCallback)(() => {
        if (isMounted.current) {
            const pendingCallbacks = pending.current;
            pending.current = [];
            pendingCallbacks.forEach((callback) => { });
        }
    }, [navigation]);
    (0, react_1.useEffect)(() => {
        if (navigationRef.current) {
            flush();
        }
    }, [flush]);
    const push = (0, react_1.useCallback)((fn) => {
        pending.current.push(fn);
        if (navigationRef.current) {
            flush();
        }
    }, [flush]);
    return push;
}
exports.useLoadedNavigation = useLoadedNavigation;
function useOptionalNavigation() {
    const [navigation, setNavigation] = (0, react_1.useState)(null);
    const loadNavigation = useLoadedNavigation();
    (0, react_1.useEffect)(() => {
        loadNavigation((nav) => setNavigation(nav));
    }, []);
    return navigation;
}
exports.useOptionalNavigation = useOptionalNavigation;
//# sourceMappingURL=useLoadedNavigation.js.map