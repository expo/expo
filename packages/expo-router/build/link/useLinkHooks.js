// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { useMemo } from 'react';
import { Platform } from 'react-native';
// Mutate the style prop to add the className on web.
export function useInteropClassName(props) {
    if (Platform.OS !== 'web') {
        return props.style;
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => {
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
export const useHrefAttrs = Platform.select({
    web: function useHrefAttrs({ asChild, rel, target, download }) {
        return useMemo(() => {
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