import { LinkMenuAction, LinkPreview, LinkTrigger } from './elements';
import type { LinkProps, WebAnchorProps } from './useLinkHooks';
import { LinkAppleZoom } from './zoom/link-apple-zoom';
import { LinkAppleZoomTarget } from './zoom/link-apple-zoom-target';
export declare const Link: ((props: LinkProps) => import("react").JSX.Element) & {
    resolveHref: (href: import("..").Href) => string;
    Menu: import("react").FC<import("./elements").LinkMenuProps>;
    Trigger: typeof LinkTrigger;
    Preview: typeof LinkPreview;
    MenuAction: typeof LinkMenuAction;
    AppleZoom: typeof LinkAppleZoom;
    AppleZoomTarget: typeof LinkAppleZoomTarget;
};
export type LinkComponent = typeof Link;
export { LinkProps, WebAnchorProps };
export { Redirect, RedirectProps } from './Redirect';
//# sourceMappingURL=Link.d.ts.map