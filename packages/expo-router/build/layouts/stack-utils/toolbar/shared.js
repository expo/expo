import { Children } from 'react';
import { StackToolbarBadge, StackToolbarIcon, StackToolbarLabel } from './toolbar-primitives';
import { getFirstChildOfType } from '../../../utils/children';
import { convertTextStyleToRNTextStyle } from '../../../utils/font';
/** @internal */
export function extractXcassetName(props) {
    const iconComponentProps = getFirstChildOfType(props.children, StackToolbarIcon)?.props;
    if (iconComponentProps && 'xcasset' in iconComponentProps) {
        return iconComponentProps.xcasset;
    }
    return undefined;
}
/**
 * Extracts the rendering mode from the Icon child component (for `src` and `xcasset` variants).
 * Returns undefined if no explicit rendering mode is set on the Icon child.
 * @internal
 */
export function extractIconRenderingMode(props) {
    const iconComponentProps = getFirstChildOfType(props.children, StackToolbarIcon)?.props;
    if (iconComponentProps && 'renderingMode' in iconComponentProps) {
        return iconComponentProps.renderingMode;
    }
    return undefined;
}
const PRIMITIVE_TYPES = ['string', 'number'];
export function areAllChildrenPrimitiveValues(children) {
    const childrenArray = Children.toArray(children);
    return (childrenArray.filter((child) => PRIMITIVE_TYPES.includes(typeof child)).length ===
        childrenArray.length);
}
export function convertChildrenToString(children) {
    return Children.toArray(children)
        .filter((child) => PRIMITIVE_TYPES.includes(typeof child))
        .join('');
}
export function convertStackHeaderSharedPropsToRNSharedHeaderItem(props, isBottomPlacement = false) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = convertChildrenToString(children);
    const label = getFirstChildOfType(children, StackToolbarLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? { sf: props.icon }
            : { src: props.icon }
        : undefined;
    const iconComponentProps = getFirstChildOfType(children, StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = getFirstChildOfType(children, StackToolbarBadge);
    const rnsIcon = (() => {
        if (!iconComponentProps) {
            return undefined;
        }
        // Bottom placement xcasset uses native xcasset type
        if ('xcasset' in iconComponentProps && isBottomPlacement) {
            return {
                type: 'xcasset',
                name: iconComponentProps.xcasset,
            };
        }
        // Unified image path for src and xcasset (non-bottom)
        if ('src' in iconComponentProps || 'xcasset' in iconComponentProps) {
            const source = 'src' in iconComponentProps ? iconComponentProps.src : { uri: iconComponentProps.xcasset };
            const explicitRenderingMode = 'renderingMode' in iconComponentProps ? iconComponentProps.renderingMode : undefined;
            const effectiveRenderingMode = explicitRenderingMode ??
                props.iconRenderingMode ??
                (props.tintColor ? 'template' : 'original');
            return {
                type: 'image',
                source,
                tinted: effectiveRenderingMode === 'template',
            };
        }
        return {
            type: 'sfSymbol',
            name: iconComponentProps.sf,
        };
    })();
    const item = {
        ...rest,
        label: label?.props.children ?? stringChildren,
        sharesBackground: !separateBackground,
    };
    if (style) {
        const convertedStyle = convertTextStyleToRNTextStyle(style) ?? {};
        item.labelStyle = convertedStyle;
    }
    if (badgeComponent) {
        item.badge = {
            value: badgeComponent.props.children ?? '',
        };
        const badgeStyle = convertTextStyleToRNTextStyle(badgeComponent.props.style);
        if (badgeStyle) {
            item.badge.style = badgeStyle;
        }
    }
    if (rnsIcon) {
        item.icon = rnsIcon;
    }
    return item;
}
//# sourceMappingURL=shared.js.map