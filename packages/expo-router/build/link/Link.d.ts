import { LinkMenuAction, LinkPreview, LinkTrigger } from './LinkWithPreview';
import type { LinkProps, WebAnchorProps } from './useLinkHooks';
export declare const Link: ((props: LinkProps) => import("react").JSX.Element) & {
    resolveHref: (href: import("..").Href) => string;
    /**
     * A component used to group context menu actions for a link.
     *
     * If multiple `Link.Menu` components are used within a single `Link`, only the first one will be rendered.
     * Only `Link.MenuAction` components are allowed as children of `Link.Menu`.
     *
     * @example
     * ```tsx
     * <Link.Menu>
     *   <Link.MenuAction title="Action 1" onPress={()=>{}} />
     *   <Link.MenuAction title="Action 2" onPress={()=>{}} />
     * </Link.Menu>
     * ```
     *
     * @platform ios
     */
    Menu: import("react").FC<import("./LinkWithPreview").LinkMenuProps>;
    /**
     * A component used as a link trigger. The content of this component will be rendered in the base link.
     *
     * If multiple `Link.Trigger` components are used within a single `Link`, only the first one will be rendered.
     *
     * @example
     * ```tsx
     * <Link href="/about">
     *   <Link.Trigger>
     *     Trigger
     *   </Link.Trigger>
     * </Link>
     * ```
     *
     * @platform ios
     */
    Trigger: typeof LinkTrigger;
    /**
     * A component used to render and customize the link preview.
     *
     * If `Link.Preview` is used without any props, it will render a preview of the `href` passed to the `Link`.
     *
     * If multiple `Link.Preview` components are used within a single `Link`, only the first one will be rendered.
     *
     * To customize the preview, you can pass custom content as children.
     *
     * @example
     * ```tsx
     * <Link href="/about">
     *   <Link.Preview>
     *     <Text>Custom Preview Content</Text>
     *   </Link.Trigger>
     * </Link>
     * ```
     *
     * @example
     * ```tsx
     * <Link href="/about">
     *   <Link.Preview />
     * </Link>
     * ```
     *
     * @platform ios
     */
    Preview: typeof LinkPreview;
    /**
     * A component used to render a context menu action for a link.
     * This component should only be used as a child of `Link.Menu`.
     *
     * @platform ios
     */
    MenuAction: typeof LinkMenuAction;
};
export type LinkComponent = typeof Link;
export { LinkProps, WebAnchorProps };
export { Redirect, RedirectProps } from './Redirect';
//# sourceMappingURL=Link.d.ts.map