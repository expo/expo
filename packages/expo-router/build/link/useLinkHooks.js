"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useHrefAttrs = exports.useInteropClassName = void 0;
// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
const react_1 = require("react");
const react_native_1 = require("react-native");
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
exports.useInteropClassName = useInteropClassName;
exports.useHrefAttrs = react_native_1.Platform.select({
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
//# sourceMappingURL=useLinkHooks.js.map