import { PropsWithChildren, JSX } from 'react';
import { Href } from '../types';
import { LinkMenu, LinkMenuItem, LinkPreview, LinkTrigger } from './LinkWithPreview';
import { LinkProps, WebAnchorProps } from './useLinkHooks';
export interface LinkComponent {
    (props: PropsWithChildren<LinkProps>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: (href: Href) => string;
    Menu: typeof LinkMenu;
    Trigger: typeof LinkTrigger;
    Preview: typeof LinkPreview;
    MenuItem: typeof LinkMenuItem;
}
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
export declare function Link(props: LinkProps): JSX.Element;
export declare namespace Link {
    var resolveHref: (href: Href) => string;
    var Menu: typeof LinkMenu;
    var Trigger: typeof LinkTrigger;
    var Preview: typeof LinkPreview;
    var MenuItem: typeof LinkMenuItem;
}
export { LinkProps, WebAnchorProps };
//# sourceMappingURL=Link.d.ts.map