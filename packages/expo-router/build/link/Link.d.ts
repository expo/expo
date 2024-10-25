import { PropsWithChildren } from 'react';
import { Href } from '../types';
import { LinkProps, WebAnchorProps } from './useLinkHooks';
export interface LinkComponent {
    <T extends string | object>(props: PropsWithChildren<LinkProps<T>>): JSX.Element;
    /** Helper method to resolve a Href object into a string. */
    resolveHref: (href: Href) => string;
}
/** Redirects to the href as soon as the component is mounted. */
export declare function Redirect({ href }: {
    href: Href;
}): null;
/**
 * Component to render link to another route using a path.
 * Uses an anchor tag on the web.
 */
export declare const Link: LinkComponent;
export { LinkProps, WebAnchorProps };
//# sourceMappingURL=Link.d.ts.map