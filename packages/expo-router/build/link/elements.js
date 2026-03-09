"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkMenu = void 0;
exports.LinkMenuAction = LinkMenuAction;
exports.LinkPreview = LinkPreview;
exports.LinkTrigger = LinkTrigger;
const react_1 = __importStar(require("react"));
const InternalLinkPreviewContext_1 = require("./InternalLinkPreviewContext");
const NativeMenuContext_1 = require("./NativeMenuContext");
const primitives_1 = require("../primitives");
const HrefPreview_1 = require("./preview/HrefPreview");
const PreviewRouteContext_1 = require("./preview/PreviewRouteContext");
const native_1 = require("./preview/native");
const Slot_1 = require("../ui/Slot");
const link_apple_zoom_1 = require("./zoom/link-apple-zoom");
const children_1 = require("../utils/children");
/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * @platform ios
 */
function LinkMenuAction(props) {
    const identifier = (0, react_1.useId)();
    if ((0, PreviewRouteContext_1.useIsPreview)() || process.env.EXPO_OS !== 'ios' || !(0, react_1.use)(NativeMenuContext_1.NativeMenuContext)) {
        return null;
    }
    const { unstable_keepPresented, onPress, children, title, ...rest } = props;
    const areChildrenString = typeof children === 'string';
    const label = areChildrenString
        ? children
        : (0, children_1.getFirstChildOfType)(children, primitives_1.Label)?.props.children;
    const iconComponent = !props.icon && !areChildrenString ? (0, children_1.getFirstChildOfType)(children, primitives_1.Icon) : undefined;
    const icon = props.icon ??
        (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
    const sf = typeof icon === 'string' ? icon : undefined;
    const rawXcasset = iconComponent?.props && 'xcasset' in iconComponent.props
        ? iconComponent.props.xcasset
        : undefined;
    const xcassetName = typeof rawXcasset === 'string' ? rawXcasset : undefined;
    return (<native_1.NativeLinkPreviewAction {...rest} identifier={identifier} icon={sf} xcassetName={xcassetName} title={label ?? title ?? ''} keepPresented={unstable_keepPresented} onSelected={() => onPress?.()}/>);
}
/**
 * Groups context menu actions for a link.
 *
 * If multiple `Link.Menu` components are used within a single `Link`, only the first will be rendered.
 * Only `Link.MenuAction` and `Link.Menu` components are allowed as children.
 *
 * @example
 * ```tsx
 * <Link.Menu>
 *   <Link.MenuAction title="Action 1" onPress={() => {}} />
 *   <Link.MenuAction title="Action 2" onPress={() => {}} />
 * </Link.Menu>
 * ```
 *
 * @platform ios
 */
const LinkMenu = (props) => {
    const identifier = (0, react_1.useId)();
    if ((0, PreviewRouteContext_1.useIsPreview)() || process.env.EXPO_OS !== 'ios' || !(0, react_1.use)(NativeMenuContext_1.NativeMenuContext)) {
        return null;
    }
    const children = react_1.default.Children.toArray(props.children).filter((child) => (0, react_1.isValidElement)(child) && (child.type === LinkMenuAction || child.type === exports.LinkMenu));
    const displayAsPalette = props.palette ?? props.displayAsPalette;
    const displayInline = props.inline ?? props.displayInline;
    return (<native_1.NativeLinkPreviewAction {...props} displayAsPalette={displayAsPalette} displayInline={displayInline} preferredElementSize={props.elementSize} title={props.title ?? ''} onSelected={() => { }} children={children} identifier={identifier}/>);
};
exports.LinkMenu = LinkMenu;
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
 *   </Link.Preview>
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
function LinkPreview(props) {
    const { children, style } = props;
    const internalPreviewContext = (0, react_1.use)(InternalLinkPreviewContext_1.InternalLinkPreviewContext);
    if ((0, PreviewRouteContext_1.useIsPreview)() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
        return null;
    }
    const { isVisible, href } = internalPreviewContext;
    const { width, height, ...restOfStyle } = style ?? {};
    const contentSize = {
        width: width ?? 0,
        height: height ?? 0,
    };
    let content;
    if (children) {
        content = isVisible ? children : null;
    }
    else {
        content = isVisible ? <HrefPreview_1.HrefPreview href={href}/> : null;
    }
    return (<native_1.NativeLinkPreviewContent style={restOfStyle} preferredContentSize={contentSize}>
      {content}
    </native_1.NativeLinkPreviewContent>);
}
/**
 * Serves as the trigger for a link.
 * The content inside this component will be rendered as part of the base link.
 *
 * If multiple `Link.Trigger` components are used within a single `Link`, only the first will be rendered.
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
function LinkTrigger({ withAppleZoom, ...props }) {
    if (react_1.default.Children.count(props.children) > 1 || !(0, react_1.isValidElement)(props.children)) {
        // If onPress is passed, this means that Link passed props to this component.
        // We can assume that asChild is used, so we throw an error, because link will not work in this case.
        if (props && typeof props === 'object' && 'onPress' in props) {
            throw new Error('When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.');
        }
        return props.children;
    }
    const content = <Slot_1.Slot {...props}/>;
    if (withAppleZoom) {
        return <link_apple_zoom_1.LinkAppleZoom>{content}</link_apple_zoom_1.LinkAppleZoom>;
    }
    return content;
}
//# sourceMappingURL=elements.js.map