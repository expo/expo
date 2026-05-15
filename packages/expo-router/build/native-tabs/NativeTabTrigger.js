"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabTrigger = void 0;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.isNativeTabTrigger = isNativeTabTrigger;
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("../react-navigation/native");
const elements_1 = require("./common/elements");
const optionsIconConverter_1 = require("./utils/optionsIconConverter");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
const useFocusEffect_1 = require("../useFocusEffect");
const children_1 = require("../utils/children");
/**
 * The component used to customize the native tab options both in the _layout file and from the tab screen.
 *
 * When used in the _layout file, you need to provide a `name` prop.
 * When used in the tab screen, the `name` prop takes no effect.
 *
 * @example
 * ```tsx app/_layout.tsx
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
 * ```tsx app/home.tsx
 * import { NativeTabs } from 'expo-router/unstable-native-tabs';
 *
 * export default function HomeScreen() {
 *   return (
 *     <View>
 *       <NativeTabs.Trigger>
 *         <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
 *       </NativeTabs.Trigger>
 *       <Text>This is home screen!</Text>
 *     </View>
 *   );
 * }
 * ```
 */
function NativeTabTriggerImpl(props) {
    const route = (0, native_1.useRoute)();
    const navigation = (0, native_1.useNavigation)();
    const isInPreview = (0, PreviewRouteContext_1.useIsPreview)();
    (0, useFocusEffect_1.useFocusEffect)((0, react_1.useCallback)(() => {
        // This will cause the tab to update only when it is focused.
        // As long as all tabs are loaded at the start, we don't need this check.
        // It is here to ensure similar behavior to stack
        if (!isInPreview) {
            if (navigation.getState()?.type !== 'tab') {
                throw new Error(`Trigger component can only be used in the tab screen. Current route: ${route.name}`);
            }
            const options = convertTabPropsToOptions(props, true);
            navigation.setOptions(options);
        }
    }, [props, isInPreview]));
    return null;
}
exports.NativeTabTrigger = Object.assign(NativeTabTriggerImpl, {
    Label: elements_1.NativeTabsTriggerLabel,
    Icon: elements_1.NativeTabsTriggerIcon,
    Badge: elements_1.NativeTabsTriggerBadge,
    VectorIcon: elements_1.NativeTabsTriggerVectorIcon,
});
function convertTabPropsToOptions({ hidden, children, role, disablePopToTop, disableScrollToTop, unstable_nativeProps, disableAutomaticContentInsets, contentStyle, disableTransparentOnScrollEdge, disabled, }, isDynamic = false) {
    const initialOptions = isDynamic
        ? {
            ...(unstable_nativeProps ? { nativeProps: unstable_nativeProps } : {}),
            ...(disableTransparentOnScrollEdge !== undefined ? { disableTransparentOnScrollEdge } : {}),
            ...(disabled !== undefined ? { disabled } : {}),
        }
        : {
            hidden: !!hidden,
            specialEffects: {
                repeatedTabSelection: {
                    popToRoot: !disablePopToTop,
                    scrollToTop: !disableScrollToTop,
                },
            },
            contentStyle,
            role,
            nativeProps: unstable_nativeProps,
            disableAutomaticContentInsets,
            ...(disableTransparentOnScrollEdge !== undefined ? { disableTransparentOnScrollEdge } : {}),
            ...(disabled !== undefined ? { disabled } : {}),
        };
    const allowedChildren = (0, children_1.filterAllowedChildrenElements)(children, [
        elements_1.NativeTabsTriggerBadge,
        elements_1.NativeTabsTriggerLabel,
        elements_1.NativeTabsTriggerIcon,
    ]);
    return allowedChildren.reduce((acc, child) => {
        if ((0, children_1.isChildOfType)(child, elements_1.NativeTabsTriggerBadge)) {
            appendBadgeOptions(acc, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, elements_1.NativeTabsTriggerLabel)) {
            appendLabelOptions(acc, child.props);
        }
        else if ((0, children_1.isChildOfType)(child, elements_1.NativeTabsTriggerIcon)) {
            (0, optionsIconConverter_1.appendIconOptions)(acc, child.props);
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
        if (props.selectedStyle) {
            options.selectedLabelStyle = react_native_1.StyleSheet.flatten(props.selectedStyle);
        }
    }
}
function isNativeTabTrigger(child, contextKey) {
    if ((0, children_1.isChildOfType)(child, exports.NativeTabTrigger)) {
        if ('name' in child.props && !child.props.name) {
            throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must have a \`name\` prop when used as a child of a Layout Route.`);
        }
        if (process.env.NODE_ENV !== 'production') {
            if (['component', 'getComponent'].some((key) => key in child.props)) {
                throw new Error(`<Trigger /> component in \`default export\` at \`app${contextKey}/_layout\` must not have a \`component\` or \`getComponent\` prop when used as a child of a Layout Route`);
            }
        }
        return true;
    }
    return false;
}
//# sourceMappingURL=NativeTabTrigger.js.map