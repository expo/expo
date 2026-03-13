import React from 'react';
import { type BaseExpoRouterLinkProps } from './BaseExpoRouterLink';
import type { Href } from '../types';
interface LinkWithPreviewProps extends BaseExpoRouterLinkProps {
    hrefForPreviewNavigation: Href;
}
export declare function LinkWithPreview({ children, ...rest }: LinkWithPreviewProps): React.JSX.Element;
export {};
//# sourceMappingURL=LinkWithPreview.d.ts.map