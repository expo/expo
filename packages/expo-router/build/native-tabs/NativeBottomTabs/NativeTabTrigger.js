"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabTrigger = NativeTabTrigger;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.isNativeTabTrigger = isNativeTabTrigger;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const utils_1 = require("./utils");
const useSafeLayoutEffect_1 = require("../../views/useSafeLayoutEffect");
const elements_1 = require("../common/elements");
/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
 *
 * @example
 * ```tsx
 * // In _layout file
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function Layout() {
 *   return (
 *     <NativeTabs>
 *       <NativeTabs.Trigger name="home" />
 *       <NativeTabs.Trigger name="settings" />
 *     </NativeTabs>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // In a tab screen
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <Label>Home</Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 * ```
 *
 * > **Note:** You can use the alias `NativeTabs.Trigger` for this component.
 */
function NativeTabTrigger(props) {
    const route = (0, native_1.useRoute)();
    const navigation = (0, native_1.useNavigation)();
    const isFocused = navigation.isFocused();
    (0, useSafeLayoutEffect_1.useSafeLayoutEffect)(() => {
        // This will cause the tab to update only when it is focused.
        // As long as all tabs are loaded at the start, we don't need this check.
        // It is here to ensure similar behavior to stack
        if (isFocused) {
            if (navigation.getState()?.type !== 'tab') {
                throw new Error(`Trigger component can only be used in the tab screen. Current route: ${route.name}`);
            }
            const options = convertTabPropsToOptions(props);
            navigation.setOptions(options);
        }
    }, [isFocused, props]);
    return null;
}
function convertTabPropsToOptions({ options, hidden, children, role, disablePopToTop, disableScrollToTop, }) {
    const initialOptions = {
        ...options,
        hidden: !!hidden,
        specialEffects: {
            repeatedTabSelection: {
                popToRoot: !disablePopToTop,
                scrollToTop: !disableScrollToTop,
            },
        },
        role: role ?? options?.role,
    };
    const allowedChildren = (0, utils_1.filterAllowedChildrenElements)(children, [elements_1.Badge, elements_1.Label, elements_1.Icon]);
    return allowedChildren.reduce((acc, child) => {
        if ((0, utils_1.isChildOfType)(child, elements_1.Badge)) {
            appendBadgeOptions(acc, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, elements_1.Label)) {
            appendLabelOptions(acc, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, elements_1.Icon)) {
            appendIconOptions(acc, child.props);
        }
        return acc;
    }, { ...initialOptions });
}
function appendBadgeOptions(options, props) {
    if (props.children) {
        options.badgeValue = String(props.children);
        options.selectedBadgeBackgroundColor = props.selectedBackgroundColor;
    }
    else if (!props.hidden) {
        // If no value is provided, we set it to a space to show the badge
        // Otherwise, the `react-native-screens` will interpret it as a hidden badge
        // https://github.com/software-mansion/react-native-screens/blob/b4358fd95dd0736fc54df6bb97f210dc89edf24c/ios/bottom-tabs/RNSBottomTabsScreenComponentView.mm#L172
        options.badgeValue = ' ';
    }
}
function appendLabelOptions(options, props) {
    if (props.hidden) {
        options.title = '';
    }
    else {
        options.title = props.children;
        options.selectedLabelStyle = props.selectedStyle;
    }
}
function appendIconOptions(options, props) {
    if ('src' in props && props.src) {
        if (typeof props.src === 'object' && 'default' in props.src) {
            options.icon = props.src.default
                ? {
                    src: props.src.default,
                }
                : undefined;
            options.selectedIcon = props.src.selected
                ? {
                    src: props.src.selected,
                }
                : undefined;
        }
        else {
            options.icon = props.src
                ? {
                    src: props.src,
                }
                : undefined;
        }
    }
    else if ('sf' in props) {
        if (process.env.EXPO_OS === 'ios') {
            if (typeof props.sf === 'string') {
                options.icon = props.sf
                    ? {
                        sf: props.sf,
                    }
                    : undefined;
            }
            else if (props.sf) {
                options.icon = props.sf.default
                    ? {
                        sf: props.sf.default,
                    }
                    : undefined;
                options.selectedIcon = props.sf.selected
                    ? {
                        sf: props.sf.selected,
                    }
                    : undefined;
            }
        }
    }
    if (process.env.EXPO_OS === 'android') {
        options.icon = { drawable: props.drawable };
        options.selectedIcon = undefined;
    }
    options.selectedIconColor = props.selectedColor;
}
function isNativeTabTrigger(child, contextKey) {
    if ((0, react_1.isValidElement)(child) && child && child.type === NativeTabTrigger) {
        if (typeof child.props === 'object' &&
            child.props &&
            'name' in child.props &&
            !child.props.name) {
            throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['component', 'getComponent'].some((key) => child.props && typeof child.props === 'object' && key in child.props)) {
                throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=NativeTabTrigger.js.map