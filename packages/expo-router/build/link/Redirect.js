"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redirect = Redirect;
const hooks_1 = require("../hooks");
const useFocusEffect_1 = require("../useFocusEffect");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
/**
 * Redirects to the `href` as soon as the component is mounted.
 *
 * @example
 * ```tsx
 * import { View, Text } from 'react-native';
 * import { Redirect } from 'expo-router';
 *
 * export default function Page() {
 *  const { user } = useAuth();
 *
 *  if (!user) {
 *    return <Redirect href="/login" />;
 *  }
 *
 *  return (
 *    <View>
 *      <Text>Welcome Back!</Text>
 *    </View>
 *  );
 * }
 * ```
 */
function Redirect({ href, relativeToDirectory, withAnchor }) {
    const router = (0, hooks_1.useRouter)();
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    (0, useFocusEffect_1.useFocusEffect)(() => {
        if (!isPreview) {
            try {
                router.replace(href, { relativeToDirectory, withAnchor });
            }
            catch (error) {
                console.error(error);
            }
        }
    });
    return null;
}
//# sourceMappingURL=Redirect.js.map