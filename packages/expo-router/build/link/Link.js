// Fork of @react-navigation/native Link.tsx with `href` and `replace` support added and
// `to` / `action` support removed.
import { Slot } from '@radix-ui/react-slot';
import * as React from 'react';
import { Text, Platform } from 'react-native';
import { useRouter } from '../hooks';
import { useFocusEffect } from '../useFocusEffect';
import { resolveHref } from './href';
import useLinkToPathProps from './useLinkToPathProps';
/** Redirects to the href as soon as the component is mounted. */
export function Redirect({ href }) {
    const router = useRouter();
    useFocusEffect(() => {
        try {
            router.replace(href);
        }
        catch (error) {
            console.error(error);
        }
    });
    return null;
}
/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 *
 * @param props.href Absolute path to route (e.g. `/feeds/hot`).
 * @param props.replace Should replace the current route without adding to the history.
 * @param props.asChild Forward props to child component. Useful for custom buttons.
 * @param props.children Child elements to render the content.
 */
export const Link = React.forwardRef(ExpoRouterLink);
Link.resolveHref = resolveHref;
function ExpoRouterLink({ href, replace, 
// TODO: This does not prevent default on the anchor tag.
asChild, ...rest }, ref) {
    const resolvedHref = React.useMemo(() => {
        if (href == null) {
            throw new Error('Link: href is required');
        }
        return resolveHref(href);
    }, [href]);
    const props = useLinkToPathProps({ href: resolvedHref, replace });
    const onPress = (e) => {
        if ('onPress' in rest) {
            rest.onPress?.(e);
        }
        props.onPress(e);
    };
    return React.createElement(
    // @ts-expect-error: slot is not type-safe
    asChild ? Slot : Text, {
        ref,
        ...props,
        ...rest,
        ...Platform.select({
            web: { onClick: onPress },
            default: { onPress },
        }),
    });
}
//# sourceMappingURL=Link.js.map