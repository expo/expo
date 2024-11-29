"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = exports.ErrorBoundary = exports.Unmatched = exports.useRouter = exports.useUnstableGlobalHref = exports.useRootNavigationState = exports.useRootNavigation = exports.useSegments = exports.useNavigationContainerRef = exports.withLayoutContext = exports.useNavigation = exports.useFocusEffect = exports.ExpoRoot = exports.Redirect = exports.Navigator = exports.Tabs = exports.Stack = exports.Slot = exports.useGlobalSearchParams = exports.useLocalSearchParams = exports.usePathname = exports.Link = void 0;
const client_1 = require("./router/client");
Object.defineProperty(exports, "useRouter", { enumerable: true, get: function () { return client_1.useRouter_UNSTABLE; } });
const host_1 = require("./router/host");
var client_2 = require("./router/client");
Object.defineProperty(exports, "Link", { enumerable: true, get: function () { return client_2.Link; } });
function usePathname() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return router.path;
}
exports.usePathname = usePathname;
// TODO: This doesn't work the same as the classic version.
function useLocalSearchParams() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
exports.useLocalSearchParams = useLocalSearchParams;
function useGlobalSearchParams() {
    const router = (0, client_1.useRouter_UNSTABLE)();
    return Object.fromEntries([...new URLSearchParams(router.query).entries()]);
}
exports.useGlobalSearchParams = useGlobalSearchParams;
function Slot() {
    return <host_1.Children />;
}
exports.Slot = Slot;
function Stack() {
    console.warn('Stack is not implemented in React Server Components yet');
    return <host_1.Children />;
}
exports.Stack = Stack;
function Tabs() {
    console.warn('Tabs is not implemented in React Server Components yet');
    return <host_1.Children />;
}
exports.Tabs = Tabs;
function Navigator() {
    throw new Error('Navigator is not implemented in React Server Components yet');
}
exports.Navigator = Navigator;
/**
 * Redirects to the `href` as soon as the component is mounted.
 */
function Redirect({ href }) {
    const router = (0, client_1.useRouter_UNSTABLE)();
    router.replace(href);
    return null;
}
exports.Redirect = Redirect;
function ExpoRoot() {
    throw new Error('ExpoRoot is not implemented in React Server Components yet');
}
exports.ExpoRoot = ExpoRoot;
function useFocusEffect() {
    console.warn('useFocusEffect is not implemented in React Server Components yet');
}
exports.useFocusEffect = useFocusEffect;
function useNavigation() {
    console.warn('useNavigation is not implemented in React Server Components yet');
}
exports.useNavigation = useNavigation;
function withLayoutContext() {
    throw new Error('withLayoutContext is not implemented in React Server Components yet');
}
exports.withLayoutContext = withLayoutContext;
function useNavigationContainerRef() {
    throw new Error('useNavigationContainerRef is not implemented in React Server Components yet');
}
exports.useNavigationContainerRef = useNavigationContainerRef;
function useSegments() {
    throw new Error('useSegments is not implemented in React Server Components yet');
}
exports.useSegments = useSegments;
function useRootNavigation() {
    throw new Error('useRootNavigation is not implemented in React Server Components yet');
}
exports.useRootNavigation = useRootNavigation;
function useRootNavigationState() {
    throw new Error('useRootNavigationState is not implemented in React Server Components yet');
}
exports.useRootNavigationState = useRootNavigationState;
function useUnstableGlobalHref() {
    throw new Error('useUnstableGlobalHref is not implemented in React Server Components yet');
}
exports.useUnstableGlobalHref = useUnstableGlobalHref;
// Expo Router Views
var Unmatched_1 = require("../views/Unmatched");
Object.defineProperty(exports, "Unmatched", { enumerable: true, get: function () { return Unmatched_1.Unmatched; } });
var ErrorBoundary_1 = require("../views/ErrorBoundary");
Object.defineProperty(exports, "ErrorBoundary", { enumerable: true, get: function () { return ErrorBoundary_1.ErrorBoundary; } });
exports.router = new Proxy({}, {
    get(target, prop, receiver) {
        throw new Error(`The router object is not available in React Server Components. Use the useRouter hook instead.`);
    },
});
// TODO:
// export { Redirect } from './link/Link';
//# sourceMappingURL=exports.js.map