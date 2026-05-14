"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouter = useRouter;
const imperative_api_1 = require("../imperative-api");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
const displayWarningForProp = (prop) => {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`router.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`);
    }
};
const createNOOPWithWarning = (prop) => () => displayWarningForProp(prop);
const routerWithWarnings = {
    back: createNOOPWithWarning('back'),
    canGoBack: () => {
        displayWarningForProp('canGoBack');
        return false;
    },
    push: createNOOPWithWarning('push'),
    navigate: createNOOPWithWarning('navigate'),
    replace: createNOOPWithWarning('replace'),
    dismiss: createNOOPWithWarning('dismiss'),
    dismissTo: createNOOPWithWarning('dismissTo'),
    dismissAll: createNOOPWithWarning('dismissAll'),
    canDismiss: () => {
        displayWarningForProp('canDismiss');
        return false;
    },
    setParams: createNOOPWithWarning('setParams'),
    reload: createNOOPWithWarning('reload'),
    prefetch: createNOOPWithWarning('prefetch'),
};
/**
 *
 * Returns the [Router](#router) object for imperative navigation.
 *
 * @example
 *```tsx
 * import { useRouter } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Route() {
 *  const router = useRouter();
 *
 *  return (
 *   <Text onPress={() => router.push('/home')}>Go Home</Text>
 *  );
 *}
 * ```
 */
function useRouter() {
    const { isPreview } = (0, PreviewRouteContext_1.usePreviewInfo)();
    if (isPreview) {
        return routerWithWarnings;
    }
    return imperative_api_1.router;
}
//# sourceMappingURL=useRouter.js.map