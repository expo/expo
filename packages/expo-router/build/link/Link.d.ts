import { LinkMenuAction, LinkPreview, LinkTrigger } from './elements';
import type { LinkProps, WebAnchorProps } from './useLinkHooks';
import { LinkAppleZoom } from './zoom/link-apple-zoom';
import { LinkAppleZoomTarget } from './zoom/link-apple-zoom-target';
export declare const Link: ((props: LinkProps) => import("react/jsx-runtime").JSX.Element) & {
    resolveHref: (href: import("..").Href) => string;
    Menu: (props: import("./elements").LinkMenuProps) => import("react/jsx-runtime").JSX.Element | null;
    Trigger: typeof LinkTrigger;
    Preview: typeof LinkPreview;
    MenuAction: typeof LinkMenuAction;
    AppleZoom: typeof LinkAppleZoom;
    AppleZoomTarget: typeof LinkAppleZoomTarget;
};
export type LinkComponent = typeof Link;
export type { LinkProps, WebAnchorProps };
export { Redirect, type RedirectProps } from './Redirect';
//# sourceMappingURL=Link.d.ts.map