'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.Redirect = void 0;
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
const react_1 = require("react");
const react_native_1 = require("react-native");
const href_1 = require("./href");
const useLinkToPathProps_1 = __importDefault(require("./useLinkToPathProps"));
const hooks_1 = require("../hooks");
const useFocusEffect_1 = require("../useFocusEffect");
const useLinkHooks_1 = require("./useLinkHooks");
const Slot_1 = require("../ui/Slot");
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
    (0, useFocusEffect_1.useFocusEffect)(() => {
        try {
            router.replace(href, { relativeToDirectory, withAnchor });
        }
        catch (error) {
            console.error(error);
        }
    });
    return null;
}
exports.Redirect = Redirect;
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
exports.Link = (0, react_1.forwardRef)(ExpoRouterLink);
exports.Link.resolveHref = href_1.resolveHref;
function ExpoRouterLink({ href, replace, push, dismissTo, 
// TODO: This does not prevent default on the anchor tag.
relativeToDirectory, asChild, rel, target, download, withAnchor, ...rest }, ref) {
    // Mutate the style prop to add the className on web.
    const style = (0, useLinkHooks_1.useInteropClassName)(rest);
    // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
    const hrefAttrs = (0, useLinkHooks_1.useHrefAttrs)({ asChild, rel, target, download });
    const resolvedHref = (0, react_1.useMemo)(() => {
        if (href == null) {
            throw new Error('Link: href is required');
        }
        return (0, href_1.resolveHref)(href);
    }, [href]);
    let event;
    if (push)
        event = 'PUSH';
    if (replace)
        event = 'REPLACE';
    if (dismissTo)
        event = 'POP_TO';
    const props = (0, useLinkToPathProps_1.default)({
        href: resolvedHref,
        event,
        relativeToDirectory,
        withAnchor,
    });
    const onPress = (e) => {
        if ('onPress' in rest) {
            rest.onPress?.(e);
        }
        props.onPress(e);
    };
    const Element = asChild ? Slot_1.Slot : react_native_1.Text;
    // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
    return (<Element ref={ref} {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({
        web: {
            onClick: onPress,
        },
        default: { onPress },
    })}/>);
}
//# sourceMappingURL=Link.js.map