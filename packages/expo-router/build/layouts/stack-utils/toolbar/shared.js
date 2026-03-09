"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractXcassetName = extractXcassetName;
exports.extractIconRenderingMode = extractIconRenderingMode;
exports.convertStackHeaderSharedPropsToRNSharedHeaderItem = convertStackHeaderSharedPropsToRNSharedHeaderItem;
const react_1 = require("react");
const toolbar_primitives_1 = require("./toolbar-primitives");
const children_1 = require("../../../utils/children");
const font_1 = require("../../../utils/font");
/** @internal */
function extractXcassetName(props) {
    const iconComponentProps = (0, children_1.getFirstChildOfType)(props.children, toolbar_primitives_1.StackToolbarIcon)?.props;
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
function extractIconRenderingMode(props) {
    const iconComponentProps = (0, children_1.getFirstChildOfType)(props.children, toolbar_primitives_1.StackToolbarIcon)?.props;
    if (iconComponentProps && 'renderingMode' in iconComponentProps) {
        return iconComponentProps.renderingMode;
    }
    return undefined;
}
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props, isBottomPlacement = false) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = react_1.Children.toArray(children)
        .filter((child) => typeof child === 'string')
        .join('');
    const label = (0, children_1.getFirstChildOfType)(children, toolbar_primitives_1.StackToolbarLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? { sf: props.icon }
            : { src: props.icon }
        : undefined;
    const iconComponentProps = (0, children_1.getFirstChildOfType)(children, toolbar_primitives_1.StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = (0, children_1.getFirstChildOfType)(children, toolbar_primitives_1.StackToolbarBadge);
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
        const convertedStyle = (0, font_1.convertTextStyleToRNTextStyle)(style) ?? {};
        item.labelStyle = convertedStyle;
    }
    if (badgeComponent) {
        item.badge = {
            value: badgeComponent.props.children ?? '',
        };
        const badgeStyle = (0, font_1.convertTextStyleToRNTextStyle)(badgeComponent.props.style);
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