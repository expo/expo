'use client';
import React, { isValidElement, use } from 'react';
import { InternalLinkPreviewContext } from './InternalLinkPreviewContext';
import { HrefPreview } from './preview/HrefPreview';
import { useIsPreview } from './preview/PreviewRouteContext';
import { NativeLinkPreviewAction, NativeLinkPreviewContent } from './preview/native';
import { Slot } from '../ui/Slot';
/**
 * This component renders a context menu action for a link.
 * It should only be used as a child of `Link.Menu` or `LinkMenu`.
 *
 * > **Note**: You can use the alias `Link.MenuAction` for this component.
 *
 * @platform ios
 */
export function LinkMenuAction(props) {
    if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
        return null;
    }
    const { unstable_keepPresented, onPress, ...rest } = props;
    return (<NativeLinkPreviewAction {...rest} onSelected={onPress} keepPresented={unstable_keepPresented}/>);
}
/**
 * Groups context menu actions for a link.
 *
 * If multiple `Link.Menu` components are used within a single `Link`, only the first will be rendered.
 * Only `Link.MenuAction` and `LinkMenuAction` components are allowed as children.
 *
 * @example
 * ```tsx
 * <Link.Menu>
 *   <Link.MenuAction title="Action 1" onPress={() => {}} />
 *   <Link.MenuAction title="Action 2" onPress={() => {}} />
 * </Link.Menu>
 * ```
 *
 * > **Note**: You can use the alias `Link.Menu` for this component.
 *
 * @platform ios
 */
export const LinkMenu = (props) => {
    if (useIsPreview() || process.env.EXPO_OS !== 'ios' || !use(InternalLinkPreviewContext)) {
        return null;
    }
    const children = React.Children.toArray(props.children).filter((child) => isValidElement(child) && (child.type === LinkMenuAction || child.type === LinkMenu));
    return (<NativeLinkPreviewAction {...props} title={props.title ?? ''} onSelected={() => { }} children={children}/>);
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
 * > **Note**: You can use the alias `Link.Preview` for this component.
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
 * > **Note**: You can use the alias `Link.Trigger` for this component.
 *
 * @platform ios
 */
export function LinkTrigger(props) {
    if (React.Children.count(props.children) > 1 || !isValidElement(props.children)) {
        // If onPress is passed, this means that Link passed props to this component.
        // We can assume that asChild is used, so we throw an error, because link will not work in this case.
        if (props && typeof props === 'object' && 'onPress' in props) {
            throw new Error('When using Link.Trigger in an asChild Link, you must pass a single child element that will emit onPress event.');
        }
        return props.children;
    }
    return <Slot {...props}/>;
}
//# sourceMappingURL=elements.js.map