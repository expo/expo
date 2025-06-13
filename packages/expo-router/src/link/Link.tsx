'use client';
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { PropsWithChildren, JSX, Children, isValidElement } from 'react';

import { resolveHref } from './href';
import { Href } from '../types';
import { BaseExpoRouterLink } from './BaseExpoRouterLink';
import {
  LinkMenu,
  LinkMenuItem,
  LinkPreview,
  LinkTrigger,
  LinkWithPreview,
} from './LinkWithPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
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
export function Link(props: LinkProps) {
  const isPreview = useIsPreview();
  if (isLinkWithPreview(props) && !isPreview) {
    return <LinkWithPreview {...props} />;
  }
  return <BaseExpoRouterLink {...props} />;
}

function isLinkWithPreview(props: LinkProps): boolean {
  return (
    props.experimentalPreview ||
    Children.toArray(props.children).some(
      (child) => isValidElement(child) && child.type === LinkPreview
    )
  );
}

Link.resolveHref = resolveHref;
Link.Menu = LinkMenu;
Link.Trigger = LinkTrigger;
Link.Preview = LinkPreview;
Link.MenuItem = LinkMenuItem;

export { LinkProps, WebAnchorProps };
