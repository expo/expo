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
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = exports.ErrorBoundary = exports.ErrorBoundaryProps = exports.Unmatched = exports.useRouter = exports.Link = void 0;
exports.usePathname = usePathname;
exports.useLocalSearchParams = useLocalSearchParams;
exports.useGlobalSearchParams = useGlobalSearchParams;
exports.Slot = Slot;
exports.Stack = Stack;
exports.Tabs = Tabs;
exports.Navigator = Navigator;
exports.Redirect = Redirect;
exports.ExpoRoot = ExpoRoot;
exports.useFocusEffect = useFocusEffect;
exports.useNavigation = useNavigation;
exports.withLayoutContext = withLayoutContext;
exports.useNavigationContainerRef = useNavigationContainerRef;
exports.useSegments = useSegments;
exports.useRootNavigation = useRootNavigation;
exports.useRootNavigationState = useRootNavigationState;
exports.useUnstableGlobalHref = useUnstableGlobalHref;
const client_1 = require("./router/client");
Object.defineProperty(exports, "useRouter", { enumerable: true, get: function () { return client_1.useRouter_UNSTABLE; } });
const host_1 = require("./router/host");
var client_2 = require("./router/client");
Object.defineProperty(exports, "Link", { enumerable: true, get: function () { return client_2.Link; } });
__exportStar(require("./router/errors"), exports);
function usePathname() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return router.path;
}
// TODO: This doesn't work the same as the classic version.
function useLocalSearchParams() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
function useGlobalSearchParams() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
function Slot() {
    return <host_1.Children />;
}
function Stack() {
    console.warn('Stack is not implemented in React Server Components yet');
    return <host_1.Children />;
}
function Tabs() {
    console.warn('Tabs is not implemented in React Server Components yet');
    return <host_1.Children />;
}
function Navigator() {
    throw new Error('Navigator is not implemented in React Server Components yet');
}
/**
 * Redirects to the `href` as soon as the component is mounted.
 */
function Redirect({ href }) {
    const router = (0, client_1.useRouter_UNSTABLE)();
    router.replace(href);
    return null;
}
function ExpoRoot() {
    throw new Error('ExpoRoot is not implemented in React Server Components yet');
}
function useFocusEffect() {
    console.warn('useFocusEffect is not implemented in React Server Components yet');
}
function useNavigation() {
    console.warn('useNavigation is not implemented in React Server Components yet');
}
function withLayoutContext() {
    throw new Error('withLayoutContext is not implemented in React Server Components yet');
}
function useNavigationContainerRef() {
    throw new Error('useNavigationContainerRef is not implemented in React Server Components yet');
}
function useSegments() {
    throw new Error('useSegments is not implemented in React Server Components yet');
}
function useRootNavigation() {
    throw new Error('useRootNavigation is not implemented in React Server Components yet');
}
function useRootNavigationState() {
    throw new Error('useRootNavigationState is not implemented in React Server Components yet');
}
function useUnstableGlobalHref() {
    throw new Error('useUnstableGlobalHref is not implemented in React Server Components yet');
}
// Expo Router Views
var expo_router_1 = require("expo-router");
Object.defineProperty(exports, "Unmatched", { enumerable: true, get: function () { return expo_router_1.Unmatched; } });
var expo_router_2 = require("expo-router");
Object.defineProperty(exports, "ErrorBoundaryProps", { enumerable: true, get: function () { return expo_router_2.ErrorBoundaryProps; } });
var expo_router_3 = require("expo-router");
Object.defineProperty(exports, "ErrorBoundary", { enumerable: true, get: function () { return expo_router_3.ErrorBoundary; } });
exports.router = new Proxy({}, {
    get(target, prop, receiver) {
        throw new Error(`The router object is not available in React Server Components. Use the useRouter hook instead.`);
    },
});
// TODO:
// export { Redirect } from './link/Link';
//# sourceMappingURL=exports.js.map