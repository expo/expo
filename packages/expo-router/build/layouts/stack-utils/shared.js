"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStackHeaderSharedPropsToRNSharedHeaderItem = convertStackHeaderSharedPropsToRNSharedHeaderItem;
const react_1 = require("react");
const common_primitives_1 = require("./common-primitives");
const utils_1 = require("./utils");
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = react_1.Children.toArray(children)
        .filter((child) => typeof child === 'string')
        .join('');
    const label = (0, utils_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? { sf: props.icon }
            : { src: props.icon }
        : undefined;
    const iconComponentProps = (0, utils_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = (0, utils_1.getFirstChildOfType)(children, common_primitives_1.StackHeaderBadge);
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
        const { backgroundColor, ...convertedStyle } = (0, utils_1.convertTextStyleToRNTextStyle)(style) ?? {};
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
        const badgeStyle = (0, utils_1.convertTextStyleToRNTextStyle)(badgeComponent.props.style);
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