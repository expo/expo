"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.Redirect = void 0;
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
const react_slot_1 = require("@radix-ui/react-slot");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
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
 *
 * @param props.href Absolute path to route (e.g. `/feeds/hot`).
 * @param props.replace Should replace the current route without adding to the history.
 * @param props.push Should push the current route, always adding to the history.
 * @param props.asChild Forward props to child component. Useful for custom buttons.
 * @param props.children Child elements to render the content.
 * @param props.className On web, this sets the HTML `class` directly. On native, this can be used with CSS interop tools like Nativewind.
 */
exports.Link = React.forwardRef(ExpoRouterLink);
exports.Link.resolveHref = href_1.resolveHref;
// Mutate the style prop to add the className on web.
function useInteropClassName(props) {
    if (react_native_1.Platform.OS !== 'web') {
        return props.style;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return React.useMemo(() => {
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
        return React.useMemo(() => {
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
asChild, rel, target, download, ...rest }, ref) {
    // Mutate the style prop to add the className on web.
    const style = useInteropClassName(rest);
    // If not passing asChild, we need to forward the props to the anchor tag using React Native Web's `hrefAttrs`.
    const hrefAttrs = useHrefAttrs({ asChild, rel, target, download });
    const resolvedHref = React.useMemo(() => {
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
    const props = (0, useLinkToPathProps_1.default)({ href: resolvedHref, event });
    const onPress = (e) => {
        if ('onPress' in rest) {
            rest.onPress?.(e);
        }
        props.onPress(e);
    };
    const Element = asChild ? react_slot_1.Slot : react_native_1.Text;
    // Avoid using createElement directly, favoring JSX, to allow tools like Nativewind to perform custom JSX handling on native.
    return (<Element ref={ref} {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({
        web: {
            onClick: onPress,
        },
        default: { onPress },
    })}/>);
}
//# sourceMappingURL=Link.js.map