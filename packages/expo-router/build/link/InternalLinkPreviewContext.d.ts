import { type RefObject } from 'react';
import type { LinkProps } from './useLinkHooks';
export type InternalLinkPreviewContextValue = {
    isVisible: boolean;
    href: LinkProps['href'];
    blockPressRef: RefObject<boolean>;
};
export declare const InternalLinkPreviewContext: import("react").Context<InternalLinkPreviewContextValue | undefined>;
//# sourceMappingURL=InternalLinkPreviewContext.d.ts.map