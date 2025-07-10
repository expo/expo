import type { Href } from '../types';
export type RedirectProps = {
    /**
     * The path of the route to navigate to. It can either be:
     * - **string**: A full path like `/profile/settings` or a relative path like `../settings`.
     * - **object**: An object with a `pathname` and optional `params`. The `pathname` can be
     * a full path like `/profile/settings` or a relative path like `../settings`. The
     * params can be an object of key-value pairs.
     *
     * @example
     * ```tsx Dynamic
     * import { Redirect } from 'expo-router';
     *
     * export default function RedirectToAbout() {
     *  return (
     *    <Redirect href="/about" />
     *  );
     *}
     * ```
     */
    href: Href;
    /**
     * Relative URL references are either relative to the directory or the document.
     * By default, relative paths are relative to the document.
     *
     * @see [Resolving relative references in Mozilla's documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL_API/Resolving_relative_references).
     */
    relativeToDirectory?: boolean;
    /**
     * Replaces the initial screen with the current route.
     */
    withAnchor?: boolean;
};
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
export declare function Redirect({ href, relativeToDirectory, withAnchor }: RedirectProps): null;
//# sourceMappingURL=Redirect.d.ts.map