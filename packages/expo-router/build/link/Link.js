"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Redirect = exports.Link = void 0;
const ExpoLink_1 = require("./ExpoLink");
const elements_1 = require("./elements");
const href_1 = require("./href");
exports.Link = Object.assign(
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
    // Re-exporting ExpoLink here so that Link.* can be used in server components.
    return <ExpoLink_1.ExpoLink {...props}/>;
}, {
    resolveHref: href_1.resolveHref,
    Menu: elements_1.LinkMenu,
    Trigger: elements_1.LinkTrigger,
    Preview: elements_1.LinkPreview,
    MenuAction: elements_1.LinkMenuAction,
});
var Redirect_1 = require("./Redirect");
Object.defineProperty(exports, "Redirect", { enumerable: true, get: function () { return Redirect_1.Redirect; } });
//# sourceMappingURL=Link.js.map