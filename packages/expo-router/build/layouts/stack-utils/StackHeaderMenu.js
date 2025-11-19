"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderMenuAction = exports.StackHeaderMenu = void 0;
exports.convertStackHeaderMenuPropsToRNHeaderItem = convertStackHeaderMenuPropsToRNHeaderItem;
exports.convertStackHeaderMenuActionPropsToRNHeaderItem = convertStackHeaderMenuActionPropsToRNHeaderItem;
const react_1 = require("react");
const shared_1 = require("./shared");
const utils_1 = require("./utils");
const primitives_1 = require("../../primitives");
exports.StackHeaderMenu = primitives_1.Menu;
function convertStackHeaderMenuPropsToRNHeaderItem(props) {
    const { title, ...rest } = props;
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, utils_1.isChildOfType)(child, exports.StackHeaderMenuAction) || (0, utils_1.isChildOfType)(child, exports.StackHeaderMenu));
    const item = {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(rest),
        type: 'menu',
        menu: {
            items: actions.map((action) => {
                if ((0, utils_1.isChildOfType)(action, exports.StackHeaderMenu)) {
                    return convertStackHeaderSubmenuMenuPropsToRNHeaderItem(action.props);
                }
                return convertStackHeaderMenuActionPropsToRNHeaderItem(action.props);
            }),
        },
    };
    if (title) {
        item.menu.title = title;
    }
    return item;
}
const SUBMENU_UNSUPPORTED_PROPS = ['title'];
function convertStackHeaderSubmenuMenuPropsToRNHeaderItem(props) {
    // Removing children. Otherwise the buttons will be broken
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, utils_1.isChildOfType)(child, exports.StackHeaderMenuAction) || (0, utils_1.isChildOfType)(child, exports.StackHeaderMenu));
    if (process.env.NODE_ENV !== 'production') {
        for (const unsupportedProp of SUBMENU_UNSUPPORTED_PROPS) {
            if (unsupportedProp in props) {
                console.warn(`Warning: The prop "${unsupportedProp}" is not supported on Stack.Header.Menu used as a submenu.`);
            }
        }
    }
    const item = {
        type: 'submenu',
        items: actions.map((action) => {
            if ((0, utils_1.isChildOfType)(action, exports.StackHeaderMenu)) {
                return convertStackHeaderSubmenuMenuPropsToRNHeaderItem(action.props);
            }
            return convertStackHeaderMenuActionPropsToRNHeaderItem(action.props);
        }),
        label: sharedProps.label,
    };
    if (sharedProps.icon) {
        // Only SF Symbols are supported in submenu icons
        if (sharedProps.icon.type === 'sfSymbol') {
            item.icon = sharedProps.icon;
        }
        else {
            console.warn('When Icon is used inside Stack.Header.Menu used as a submenu, only sfSymbol icons are supported. This is a limitation of React Native Screens.');
        }
    }
    return item;
}
exports.StackHeaderMenuAction = primitives_1.MenuAction;
function convertStackHeaderMenuActionPropsToRNHeaderItem(props) {
    const { children, isOn, unstable_keepPresented, icon, ...rest } = props;
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const item = {
        ...rest,
        type: 'action',
        label: sharedProps.label,
        state: isOn ? 'on' : 'off',
        onPress: props.onPress ?? (() => { }),
    };
    if (unstable_keepPresented !== undefined) {
        item.keepsMenuPresented = unstable_keepPresented;
    }
    if (sharedProps.icon) {
        // Only SF Symbols are supported in action icons
        if (sharedProps.icon.type === 'sfSymbol') {
            item.icon = sharedProps.icon;
        }
        else {
            console.warn('When Icon is used inside Stack.Header.Menu.Action, only sfSymbol icons are supported. This is a limitation of React Native Screens.');
        }
    }
    return item;
}
//# sourceMappingURL=StackHeaderMenu.js.map