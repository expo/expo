import { TextProps } from '@bacons/react-views';
import * as React from 'react';
import { GestureResponderEvent } from 'react-native';
import { Href, resolveHref } from './href';
export interface LinkProps extends Omit<TextProps, 'href' | 'hoverStyle'> {
    /** Path to route to. */
    href: Href;
    /** Forward props to child component. Useful for custom buttons. */
    asChild?: boolean;
    /** Should replace the current route without adding to the history. */
    replace?: boolean;
    onPress?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent> | GestureResponderEvent) => void;
}
/** Redirects to the href as soon as the component is mounted. */
export declare function Redirect({ href }: {
    href: Href;
}): null;
export interface LinkComponent {
    (props: React.PropsWithChildren<LinkProps>): JSX.Element;
    /** Helper method to resolve an Href object into a string. */
    resolveHref: typeof resolveHref;
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
export declare const Link: LinkComponent;
//# sourceMappingURL=Link.d.ts.map