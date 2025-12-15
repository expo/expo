"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStackHeaderSharedPropsToRNSharedHeaderItem = convertStackHeaderSharedPropsToRNSharedHeaderItem;
const react_1 = require("react");
const react_native_1 = require("react-native");
const common_primitives_1 = require("./common-primitives");
const children_1 = require("../../utils/children");
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = react_1.Children.toArray(children)
        .filter((child) => typeof child === 'string')
        .join('');
    const label = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? { sf: props.icon }
            : { src: props.icon }
        : undefined;
    const iconComponentProps = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderBadge);
    const rnsIcon = (() => {
        if (!iconComponentProps) {
            return undefined;
        }
        if ('src' in iconComponentProps) {
            return {
                type: 'image',
                source: iconComponentProps.src,
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
        const { backgroundColor, ...convertedStyle } = convertTextStyleToRNTextStyle(style) ?? {};
        item.labelStyle = convertedStyle;
        item.hidesSharedBackground = backgroundColor === 'transparent';
    }
    else {
        item.hidesSharedBackground = false;
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
function convertTextStyleToRNTextStyle(style) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(style);
    if (!flattenedStyle) {
        return undefined;
    }
    if ('fontWeight' in flattenedStyle) {
        return {
            ...flattenedStyle,
            fontWeight: typeof flattenedStyle.fontWeight === 'number'
                ? String(flattenedStyle.fontWeight)
                : flattenedStyle.fontWeight,
        };
    }
    return flattenedStyle;
}
//# sourceMappingURL=shared.js.map