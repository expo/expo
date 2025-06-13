"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = Link;
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
const react_1 = require("react");
const href_1 = require("./href");
const BaseExpoRouterLink_1 = require("./BaseExpoRouterLink");
const LinkWithPreview_1 = require("./LinkWithPreview");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
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
function Link(props) {
    const isPreview = (0, PreviewRouteContext_1.useIsPreview)();
    if (isLinkWithPreview(props) && !isPreview) {
        return <LinkWithPreview_1.LinkWithPreview {...props}/>;
    }
    return <BaseExpoRouterLink_1.BaseExpoRouterLink {...props}/>;
}
function isLinkWithPreview(props) {
    return (props.experimentalPreview ||
        react_1.Children.toArray(props.children).some((child) => (0, react_1.isValidElement)(child) && child.type === LinkWithPreview_1.LinkPreview));
}
Link.resolveHref = href_1.resolveHref;
Link.Menu = LinkWithPreview_1.LinkMenu;
Link.Trigger = LinkWithPreview_1.LinkTrigger;
Link.Preview = LinkWithPreview_1.LinkPreview;
Link.MenuItem = LinkWithPreview_1.LinkMenuItem;
//# sourceMappingURL=Link.js.map