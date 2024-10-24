import { PropsWithChildren } from 'react';
import { Href } from '../types';
import { LinkProps, WebAnchorProps } from './useLinkHooks';
export interface LinkComponent {
    <T extends string | object>(props: PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve a Href object into a string. */
    resolveHref: (href: Href) => string;
}
/** Redirects to the href as soon as the component is mounted. */
export declare function Redirect({ href }: {
    href: Href;
}): null;
/**
 * Component to render link to another route using a path passed via [`href`](#href).
 * By default, it accepts children and wraps them in a `<Text>` component.
 *
 * Uses an anchor tag (`<a>`) on web and performs a client-side navigation to preserve
 * the state of the website and navigate faster. The [web-only attributes](#webanchorprops)
 * such as `target` `rel`, and `download` are supported and passed to the anchor tag on web.
 *
 * > **Note**: Client-side navigation works with both single-page apps,
 * and [static-rendering](/router/reference/static-rendering/).
 *
 * > An alternative to using the `Link` component, you can also use imperative
 * navigation with [`router`](#router).
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