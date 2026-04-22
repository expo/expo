'use client';
import React, { isValidElement, use, useId } from 'react';
import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { NativeMenuContext } from './NativeMenuContext';
import { Icon, Label } from '../primitives';
import { HrefPreview } from './preview/HrefPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
import { NativeLinkPreviewAction, NativeLinkPreviewContent } from './preview/native';
import { Slot } from '../ui/Slot';
import { LinkAppleZoom } from './zoom/link-apple-zoom';
import { getFirstChildOfType } from '../utils/children';
/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * @platform ios
 */
export function LinkMenuAction(props) {
    const identifier = useId();
    if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(NativeMenuContext)) {
        return null;
    }
    const { unstable_keepPresented, onPress, children, title, ...rest } = props;
    const areChildrenString = typeof children === 'string';
    const label = areChildrenString
        ? children
        : getFirstChildOfType(children, Label)?.props.children;
    const iconComponent = !props.icon && !areChildrenString ? getFirstChildOfType(children, Icon) : undefined;
    const icon = props.icon ??
        (iconComponent?.props && 'sf' in iconComponent.props ? iconComponent.props.sf : undefined);
    const sf = typeof icon === 'string' ? icon : undefined;
    const rawXcasset = iconComponent?.props && 'xcasset' in iconComponent.props
        ? iconComponent.props.xcasset
        : undefined;
    const xcassetName = typeof rawXcasset === 'string' ? rawXcasset : undefined;
    return (<NativeLinkPreviewAction {...rest} identifier={identifier} icon={sf} xcassetName={xcassetName} title={label ?? title ?? ''} keepPresented={unstable_keepPresented} onSelected={() => onPress?.()}/>);
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
export const LinkMenu = (props) => {
    const identifier = useId();
    if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(NativeMenuContext)) {
        return null;
    }
    const children = React.Children.toArray(props.children).filter((child) => isValidElement(child) && (child.type === LinkMenuAction || child.type === LinkMenu));
    const displayAsPalette = props.palette ?? props.displayAsPalette;
    const displayInline = props.inline ?? props.displayInline;
    return (<NativeLinkPreviewAction {...props} displayAsPalette={displayAsPalette} displayInline={displayInline} preferredElementSize={props.elementSize} title={props.title ?? ''} onSelected={() => { }} children={children} identifier={identifier}/>);
};
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
export function LinkPreview(props) {
    const { children, style } = props;
    const internalPreviewContext = use(InternalLinkPreviewContext);
    if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !internalPreviewContext) {
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
        content = isVisible ? <HrefPreview href={href}/> : null;
    }
    return (<NativeLinkPreviewContent style={restOfStyle} preferredContentSize={contentSize}>
      {content}
    </NativeLinkPreviewContent>);
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
export function LinkTrigger({ withAppleZoom, ...props }) {
    if (React.Children.count(props.children) > 1 || !isValidElement(props.children)) {
        // If onPress is passed, this means that Link passed props to this component.
        // We can assume that asChild is used, so we throw an error, because link will not work in this case.
        if (props && typeof props === 'object' && 'onPress' in props) {
            throw new Error('When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.');
        }
        return props.children;
    }
    const content = <Slot {...props}/>;
    if (withAppleZoom) {
        return <LinkAppleZoom>{content}</LinkAppleZoom>;
    }
    return content;
}
//# sourceMappingURL=elements.js.map