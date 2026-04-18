'use client';
import { useRouter } from '../hooks';
import { useFocusEffect } from '../useFocusEffect';
import { useIsPreview } from './preview/PreviewRouteContext';
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
export function Redirect({ href, relativeToDirectory, withAnchor }) {
    const router = useRouter();
    const isPreview = useIsPreview();
    useFocusEffect(() => {
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