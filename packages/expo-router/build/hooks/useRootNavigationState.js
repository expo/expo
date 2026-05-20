"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRootNavigationState = useRootNavigationState;
const constants_1 = require("../constants");
const native_1 = require("../react-navigation/native");
/**
 * Returns the [navigation state](https://reactnavigation.org/docs/navigation-state/)
 * of the navigator which contains the current screen.
 *
 * @example
 * ```tsx
 * import { useRootNavigationState } from 'expo-router';
 *
 * export default function Route() {
 *  const { routes } = useRootNavigationState();
 *
 *  return <Text>{routes[0].name}</Text>;
 * }
 * ```
 */
function useRootNavigationState() {
    const parent = 
    // We assume that this is called from routes in __root
    // Users cannot customize the generated Sitemap or NotFound routes, so we should be safe
    (0, native_1.useNavigation)().getParent(constants_1.INTERNAL_SLOT_NAME);
    if (!parent) {
        throw new Error('useRootNavigationState was called from a generated route. This is likely a bug in Expo Router.');
    }
    return parent.getState();
}
//# sourceMappingURL=useRootNavigationState.js.map