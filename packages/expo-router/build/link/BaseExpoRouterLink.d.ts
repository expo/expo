import React from 'react';
import { LinkProps } from './useLinkHooks';
export interface BaseExpoRouterLinkProps extends LinkProps {
    withZoomTransition: boolean;
}
export declare function BaseExpoRouterLink({ href, replace, push, dismissTo, relativeToDirectory, asChild, rel, target, download, withAnchor, withZoomTransition, dangerouslySingular: singular, prefetch, ...rest }: BaseExpoRouterLinkProps): React.JSX.Element;
//# sourceMappingURL=BaseExpoRouterLink.d.ts.map