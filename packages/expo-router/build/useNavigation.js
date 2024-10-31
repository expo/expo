'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveParentId = exports.useNavigation = void 0;
const native_1 = require("@react-navigation/native");
const react_1 = __importDefault(require("react"));
const Route_1 = require("./Route");
const matchers_1 = require("./matchers");
/**
 * Returns the underlying React Navigation [`navigation` prop](https://reactnavigation.org/docs/navigation-prop)
 * to imperatively access layout-specific functionality like `navigation.openDrawer()` in a
 * [Drawer](/router/advanced/drawer/) layout.
 *
 * @example
 * ```tsx app/index.tsx
 * import { useNavigation } from 'expo-router';
 *
 * export default function Route() {
 *   // Access the current navigation object for the current route.
 *   const navigation = useNavigation();
 *
 *   return (
 *     <View>
 *       <Text onPress={() => {
 *         // Open the drawer view.
 *         navigation.openDrawer();
 *       }}>
 *         Open Drawer
 *       </Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * When using nested layouts, you can access higher-order layouts by passing a secondary argument denoting the layout route.
 * For example, `/menu/_layout.tsx` is nested inside `/app/orders/`, you can use `useNavigation('/orders/menu/')`.
 *
 * @example
 * ```tsx app/orders/menu/index.tsx
 * import { useNavigation } from 'expo-router';
 *
 * export default function MenuRoute() {
 *   const rootLayout = useNavigation('/');
 *   const ordersLayout = useNavigation('/orders');
 *
 *   // Same as the default results of `useNavigation()` when invoked in this route.
 *   const parentLayout = useNavigation('/orders/menu');
 * }
 * ```
 *
 * If you attempt to access a layout that doesn't exist, an error such as
 * `Could not find parent navigation with route "/non-existent"` is thrown.
 *
 *
 * @param parent Provide an absolute path such as `/(root)` to the parent route or a relative path like `../../` to the parent route.
 * @returns The navigation object for the current route.
 *
 * @see React Navigation documentation on [navigation dependent functions](https://reactnavigation.org/docs/navigation-prop/#navigator-dependent-functions)
 * for more information.
 */
function useNavigation(parent) {
    const navigation = (0, native_1.useNavigation)();
    const contextKey = (0, Route_1.useContextKey)();
    const normalizedParent = react_1.default.useMemo(() => {
        if (!parent) {
            return null;
        }
        const normalized = (0, matchers_1.getNameFromFilePath)(parent);
        if (parent.startsWith('.')) {
            return relativePaths(contextKey, parent);
        }
        return normalized;
    }, [contextKey, parent]);
    if (normalizedParent != null) {
        const parentNavigation = navigation.getParent(normalizedParent);
        // TODO: Maybe print a list of parents...
        if (!parentNavigation) {
            throw new Error(`Could not find parent navigation with route "${parent}".` +
                (normalizedParent !== parent ? ` (normalized: ${normalizedParent})` : ''));
        }
        return parentNavigation;
    }
    return navigation;
}
exports.useNavigation = useNavigation;
function resolveParentId(contextKey, parentId) {
    if (!parentId) {
        return null;
    }
    if (parentId.startsWith('.')) {
        return (0, matchers_1.getNameFromFilePath)(relativePaths(contextKey, parentId));
    }
    return (0, matchers_1.getNameFromFilePath)(parentId);
}
exports.resolveParentId = resolveParentId;
// Resolve a path like `../` relative to a path like `/foo/bar`
function relativePaths(from, to) {
    const fromParts = from.split('/').filter(Boolean);
    const toParts = to.split('/').filter(Boolean);
    for (const part of toParts) {
        if (part === '..') {
            if (fromParts.length === 0) {
                throw new Error(`Cannot resolve path "${to}" relative to "${from}"`);
            }
            fromParts.pop();
        }
        else if (part === '.') {
            // Ignore
        }
        else {
            fromParts.push(part);
        }
    }
    return '/' + fromParts.join('/');
}
//# sourceMappingURL=useNavigation.js.map