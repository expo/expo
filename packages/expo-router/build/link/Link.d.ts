import { PropsWithChildren, JSX } from 'react';
import { Href } from '../types';
import { LinkProps, WebAnchorProps } from './useLinkHooks';
export interface LinkComponent {
    (props: PropsWithChildren<LinkProps>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: (href: Href) => string;
}
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
     *    <Redirect href="/about">About</Link>
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
/**
 * Component that renders a link using [`href`](#href) to another route.
 * By default, it accepts children and wraps them in a `<Text>` component.
 *
 * Uses an anchor tag (`<a>`) on web and performs a client-side navigation to preserve
 * the state of the website and navigate faster. The web-only attributes such as `target`,
 * `rel`, and `download` are supported and passed to the anchor tag on web. See
 * [`WebAnchorProps`](#webanchorprops) for more details.
 *
 * > **Note**: Client-side navigation works with both single-page apps,
 * and [static-rendering](/router/reference/static-rendering/).
 *
 * @example
 * ```tsx
 * import { Link } from 'expo-router';
 * import { View } from 'react-native';
 *
 * export default function Route() {
 *  return (
 *   <View>
 *    <Link href="/about">About</Link>
 *   </View>
 *  );
 *}
 * ```
 */
export declare const Link: LinkComponent;
export { LinkProps, WebAnchorProps };
//# sourceMappingURL=Link.d.ts.map