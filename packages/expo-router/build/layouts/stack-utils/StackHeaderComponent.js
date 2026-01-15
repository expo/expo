"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderComponent = StackHeaderComponent;
exports.appendStackHeaderPropsToOptions = appendStackHeaderPropsToOptions;
const react_1 = require("react");
const react_native_1 = require("react-native");
const StackHeaderBackButton_1 = require("./StackHeaderBackButton");
const StackHeaderLeftRight_1 = require("./StackHeaderLeftRight");
const StackHeaderTitle_1 = require("./StackHeaderTitle");
const StackSearchBar_1 = require("./StackSearchBar");
const children_1 = require("../../utils/children");
const Screen_1 = require("../../views/Screen");
/**
 * The component used to configure the whole stack header.
 *
 * When used inside a screen, it allows you to customize the header dynamically by composing
 * header subcomponents (title, left/right areas, back button, search bar, etc.).
 *
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Header>
 *         <Stack.Header.Title>Page title</Stack.Header.Title>
 *         <Stack.Header.Left>
 *           <Stack.Header.Button onPress={() => alert('Left pressed')} />
 *         </Stack.Header.Left>
 *         <Stack.Header.Right>
 *           <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *         </Stack.Header.Right>
 *       </Stack.Header>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * When used inside a layout, it needs to be wrapped in `Stack.Screen` to take effect.
 *
 * Example (inside a layout):
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Layout() {
 *   return (
 *     <Stack>
 *       <Stack.Screen name="index">
 *         <Stack.Header>
 *           <Stack.Header.Title>Layout title</Stack.Header.Title>
 *           <Stack.Header.Right>
 *             <Stack.Header.Button onPress={() => alert('Right pressed')} />
 *           </Stack.Header.Right>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </Stack>
 *   );
 * }
 * ```
 */
function StackHeaderComponent(props) {
    // This component will only render when used inside a page
    // but only if it is not wrapped in Stack.Screen
    const updatedOptions = (0, react_1.useMemo)(() => appendStackHeaderPropsToOptions({}, props), [props]);
    return <Screen_1.Screen options={updatedOptions}/>;
}
function appendStackHeaderPropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    if (props.hidden) {
        return { ...options, headerShown: false };
    }
    if (props.asChild) {
        return { ...options, header: () => props.children };
    }
    let updatedOptions = {
        ...options,
        headerShown: !props.hidden,
        headerBlurEffect: props.blurEffect,
        headerStyle: {
            backgroundColor: flattenedStyle?.backgroundColor,
        },
        headerLargeStyle: {
            backgroundColor: flattenedLargeStyle?.backgroundColor,
        },
        headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
        headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
    };
    function appendChildOptions(child, options) {
        let updatedOptions = options;
        if ((0, children_1.isChildOfType)(child, StackHeaderTitle_1.StackHeaderTitle)) {
            updatedOptions = (0, StackHeaderTitle_1.appendStackHeaderTitlePropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, StackHeaderLeftRight_1.StackHeaderLeft)) {
            updatedOptions = (0, StackHeaderLeftRight_1.appendStackHeaderLeftPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, StackHeaderLeftRight_1.StackHeaderRight)) {
            updatedOptions = (0, StackHeaderLeftRight_1.appendStackHeaderRightPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, StackHeaderBackButton_1.StackHeaderBackButton)) {
            updatedOptions = (0, StackHeaderBackButton_1.appendStackHeaderBackButtonPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, StackSearchBar_1.StackSearchBar)) {
            updatedOptions = (0, StackSearchBar_1.appendStackSearchBarPropsToOptions)(updatedOptions, child.props);
        }
        else {
            console.warn(`Warning: Unknown child element passed to Stack.Header: ${child.type.name ?? child.type}`);
        }
        return updatedOptions;
    }
    react_1.Children.forEach(props.children, (child) => {
        if ((0, react_1.isValidElement)(child)) {
            updatedOptions = appendChildOptions(child, updatedOptions);
        }
    });
    return updatedOptions;
}
//# sourceMappingURL=StackHeaderComponent.js.map