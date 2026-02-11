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
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props) {
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
        if ('src' in iconComponentProps) {
            // Get explicit renderingMode from icon component props, or use iconRenderingMode from shared props
            const explicitRenderingMode = 'renderingMode' in iconComponentProps ? iconComponentProps.renderingMode : undefined;
            const effectiveRenderingMode = explicitRenderingMode ??
                props.iconRenderingMode ??
                (props.tintColor ? 'template' : 'original');
            return {
                type: 'image',
                source: iconComponentProps.src,
                tinted: effectiveRenderingMode === 'template',
            };
        }
        if ('xcasset' in iconComponentProps) {
            const explicitIconRenderingMode = 'renderingMode' in iconComponentProps ? iconComponentProps.renderingMode : undefined;
            if (process.env.NODE_ENV !== 'production' &&
                (props.iconRenderingMode || explicitIconRenderingMode)) {
                console.warn('renderingMode has no effect on xcasset icons in left and right toolbar placements. The rendering mode for xcasset icons is controlled by the "Render As" setting in the Xcode asset catalog.');
            }
            // Type assertion needed: xcasset is supported by react-native-screens
            // but not yet typed in @react-navigation/native-stack's PlatformIconIOS
            return {
                type: 'xcasset',
                name: iconComponentProps.xcasset,
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