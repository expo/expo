import { ExpoLink } from './ExpoLink';
import { LinkMenu, LinkMenuAction, LinkPreview, LinkTrigger } from './elements';
import { resolveHref } from './href';
import type { LinkProps, WebAnchorProps } from './useLinkHooks';

export const Link = Object.assign(
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
  function Link(props: LinkProps) {
    // Re-exporting ExpoLink here so that Link.* can be used in server components.
    return <ExpoLink {...props} />;
  },
  {
    resolveHref,
    Menu: LinkMenu,
    Trigger: LinkTrigger,
    Preview: LinkPreview,
    MenuAction: LinkMenuAction,
  }
);

export type LinkComponent = typeof Link;

export { LinkProps, WebAnchorProps };
export { Redirect, RedirectProps } from './Redirect';
