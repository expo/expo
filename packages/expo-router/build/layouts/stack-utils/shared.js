"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertStackHeaderSharedPropsToRNSharedHeaderItem = convertStackHeaderSharedPropsToRNSharedHeaderItem;
const react_1 = require("react");
const common_primitives_1 = require("./common-primitives");
const children_1 = require("../../utils/children");
const font_1 = require("../../utils/font");
function convertStackHeaderSharedPropsToRNSharedHeaderItem(props) {
    const { children, style, separateBackground, icon, ...rest } = props;
    const stringChildren = react_1.Children.toArray(children)
        .filter((child) => typeof child === 'string')
        .join('');
    const label = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarLabel);
    const iconPropConvertedToIcon = props.icon
        ? typeof props.icon === 'string'
            ? { sf: props.icon }
            : { src: props.icon }
        : undefined;
    const iconComponentProps = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarIcon)?.props ?? iconPropConvertedToIcon;
    const badgeComponent = (0, children_1.getFirstChildOfType)(children, common_primitives_1.StackToolbarBadge);
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