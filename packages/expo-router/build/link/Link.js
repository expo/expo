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
// Mutate the style prop to add the className on web.
function useInteropClassName(props) {
    if (react_native_1.Platform.OS !== 'web') {
        return props.style;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return (0, react_1.useMemo)(() => {
        if (props.className == null) {
            return props.style;
        }
        const cssStyle = {
            $$css: true,
            __routerLinkClassName: props.className,
        };
        if (Array.isArray(props.style)) {
            return [...props.style, cssStyle];
        }
        return [props.style, cssStyle];
    }, [props.style, props.className]);
}
const useHrefAttrs = react_native_1.Platform.select({
    web: function useHrefAttrs({ asChild, rel, target, download }) {
        return (0, react_1.useMemo)(() => {
            const hrefAttrs = {
                rel,
                target,
                download,
            };
            if (asChild) {
                return hrefAttrs;
            }
            return {
                hrefAttrs,
            };
        }, [asChild, rel, target, download]);
    },
    default: function useHrefAttrs() {
        return {};
    },
});
function ExpoRouterLink({ href, replace, push, 
// TODO: This does not prevent default on the anchor tag.
relativeToDirectory, asChild, rel, target, download, ...rest }, ref) {
    // Mutate the style prop to add the className on web.
    const style = useInteropClassName(rest);
    // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
    const hrefAttrs = useHrefAttrs({ asChild, rel, target, download });
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
    const props = (0, useLinkToPathProps_1.default)({ href: resolvedHref, event, relativeToDirectory });
    const onPress = (e) => {
        if ('onPress' in rest) {
            rest.onPress?.(e);
        }
        props.onPress(e);
    };
    const Element = asChild ? LinkSlot_1.Slot : react_native_1.Text;
    // Avoid using createElement directly, favoring JSX, to allow tools like Nativewind to perform custom JSX handling on native.
    return (<Element ref={ref} {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({
        web: {
            onClick: onPress,
        },
        default: { onPress },
    })}/>);
}
//# sourceMappingURL=Link.js.map