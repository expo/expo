"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getImageSourceFromIcon = getImageSourceFromIcon;
exports.convertStackHeaderSharedPropsToRNSharedHeaderItem = convertStackHeaderSharedPropsToRNSharedHeaderItem;
const react_1 = require("react");
const common_primitives_1 = require("./common-primitives");
const children_1 = require("../../utils/children");
const font_1 = require("../../utils/font");
/**
 * Helper to compute image source for useImage hook from the new icon type (with sf: prefix).
 * Returns empty object for SF symbols (they don't need useImage) and passes through other sources.
 * This avoids complex union type computation that TypeScript can't handle.
 */
function getImageSourceFromIcon(icon) {
    if (!icon)
        return {};
    return icon;
}
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = react_1.Children.toArray(children)
        .filter((child) => typeof child === 'string')
        .join('');
    const label = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? props.icon.startsWith('sf:')
                ? { sf: props.icon.slice(3) } // Remove 'sf:' prefix for RN
                : { src: { uri: props.icon } } // Wrap plain string as image source
            : { src: props.icon } // ImageSourcePropType passed as-is
        : undefined;
    const iconComponentProps = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarBadge);
    const rnsIcon = (() => {
        if (!iconComponentProps) {
            return undefined;
        }
        if ('src' in iconComponentProps && iconComponentProps.src) {
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
        if ('sf' in iconComponentProps && iconComponentProps.sf) {
            return {
                type: 'sfSymbol',
                name: iconComponentProps.sf,
            };
        }
        return undefined;
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