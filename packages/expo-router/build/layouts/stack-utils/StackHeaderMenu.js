"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderMenuAction = exports.StackHeaderMenu = void 0;
exports.convertStackHeaderMenuPropsToRNHeaderItem = convertStackHeaderMenuPropsToRNHeaderItem;
exports.convertStackHeaderMenuActionPropsToRNHeaderItem = convertStackHeaderMenuActionPropsToRNHeaderItem;
const react_1 = require("react");
const shared_1 = require("./shared");
const primitives_1 = require("../../primitives");
const children_1 = require("../../utils/children");
/**
 * Component representing menu for `Stack.Header.Right` or `Stack.Header.Left`.
 *
 * Use as `Stack.Header.Menu` to provide top-level menus on iOS header bars.
 * It accepts `Stack.Header.MenuAction` and nested `Stack.Header.Menu`
 * elements. Menu can be configured using both component props and child
 * elements.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Alert } from 'react-native';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Menu>
 *               <Stack.Header.Label>Menu</Stack.Header.Label>
 *               <Stack.Header.Icon sf="ellipsis.circle" />
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.MenuAction isOn icon="star.fill">
 *                 Action 2
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.Menu inline>
 *                 <Stack.Header.MenuAction isOn>Sub Action</Stack.Header.MenuAction>
 *               </Stack.Header.Menu>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Menu>
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.Menu inline palette title="Icons">
 *                 <Stack.Header.MenuAction isOn icon="star.fill" />
 *                 <Stack.Header.MenuAction icon="heart.fill" />
 *               </Stack.Header.Menu>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
exports.StackHeaderMenu = primitives_1.Menu;
function convertStackHeaderMenuPropsToRNHeaderItem(props) {
    const { title, ...rest } = props;
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, children_1.isChildOfType)(child, exports.StackHeaderMenuAction) || (0, children_1.isChildOfType)(child, exports.StackHeaderMenu));
    const item = {
        ...(0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(rest),
        type: 'menu',
        menu: {
            items: actions.map((action) => {
                if ((0, children_1.isChildOfType)(action, exports.StackHeaderMenu)) {
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
function convertStackHeaderSubmenuMenuPropsToRNHeaderItem(props) {
    // Removing children. Otherwise the buttons will be broken
    const sharedProps = (0, shared_1.convertStackHeaderSharedPropsToRNSharedHeaderItem)(props);
    const actions = react_1.Children.toArray(props.children).filter((child) => (0, children_1.isChildOfType)(child, exports.StackHeaderMenuAction) || (0, children_1.isChildOfType)(child, exports.StackHeaderMenu));
    // TODO: Remove  Pick<HeaderBarButtonItemSubmenu> when this PR is merged and released in react-navigation:
    // https://github.com/react-navigation/react-navigation/pull/12895
    const item = {
        type: 'submenu',
        items: actions.map((action) => {
            if ((0, children_1.isChildOfType)(action, exports.StackHeaderMenu)) {
                return convertStackHeaderSubmenuMenuPropsToRNHeaderItem(action.props);
            }
            return convertStackHeaderMenuActionPropsToRNHeaderItem(action.props);
        }),
        label: sharedProps.label || props.title || '',
    };
    if (props.inline !== undefined) {
        item.displayInline = props.inline;
    }
    if (props.palette !== undefined) {
        item.displayAsPalette = props.palette;
    }
    if (props.destructive !== undefined) {
        item.destructive = props.destructive;
    }
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
/**
 * An action item for a `Stack.Header.Menu`.
 *
 * @example
 * ```tsx
 * import React from 'react';
 * import { Alert } from 'react-native';
 * import { Stack, Label, Icon } from 'expo-router';
 *
 * export default function ExampleScreen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Right>
 *             <Stack.Header.Menu icon="ellipsis.circle">
 *               <Stack.Header.MenuAction onPress={() => Alert.alert('Action 1 pressed!')}>
 *                 Action 1
 *               </Stack.Header.MenuAction>
 *               <Stack.Header.MenuAction isOn onPress={() => Alert.alert('Action 2 pressed!')}>
 *                 <Label>Action 2</Label>
 *                 <Icon sf="star.fill" />
 *               </Stack.Header.MenuAction>
 *             </Stack.Header.Menu>
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/menus) for more information about menus on iOS.
 *
 * @platform ios
 */
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