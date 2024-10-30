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
const LinkSlot_1 = require("./LinkSlot");
const href_1 = require("./href");
const useLinkToPathProps_1 = __importDefault(require("./useLinkToPathProps"));
const hooks_1 = require("../hooks");
const useFocusEffect_1 = require("../useFocusEffect");
const useLinkHooks_1 = require("./useLinkHooks");
/** Redirects to the href as soon as the component is mounted. */
function Redirect({ href }) {
    const router = (0, hooks_1.useRouter)();
    (0, useFocusEffect_1.useFocusEffect)(() => {
        try {
            router.replace(href);
        }
        catch (error) {
            console.error(error);
        }
    });
    return null;
}
exports.Redirect = Redirect;
/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 */
exports.Link = (0, react_1.forwardRef)(ExpoRouterLink);
exports.Link.resolveHref = href_1.resolveHref;
function ExpoRouterLink({ href, replace, push, 
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
    const Element = asChild ? LinkSlot_1.Slot : react_native_1.Text;
    // Avoid using createElement directly, favoring JSX, to allow tools like NativeWind to perform custom JSX handling on native.
    return (<Element ref={ref} {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({
        web: {
            onClick: onPress,
        },
        default: { onPress },
    })}/>);
}
//# sourceMappingURL=Link.js.map