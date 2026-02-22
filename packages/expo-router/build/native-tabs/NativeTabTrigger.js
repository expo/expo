"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeTabTrigger = void 0;
exports.convertTabPropsToOptions = convertTabPropsToOptions;
exports.appendIconOptions = appendIconOptions;
exports.isNativeTabTrigger = isNativeTabTrigger;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const react_native_1 = require("react-native");
const elements_1 = require("./common/elements");
const icon_1 = require("./utils/icon");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
const useFocusEffect_1 = require("../useFocusEffect");
const children_1 = require("../utils/children");
const materialIconConverter_1 = require("./utils/materialIconConverter");
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
function convertTabPropsToOptions({ hidden, children, role, disablePopToTop, disableScrollToTop, unstable_nativeProps, disableAutomaticContentInsets, contentStyle, disableTransparentOnScrollEdge, }, isDynamic = false) {
    const initialOptions = isDynamic
        ? {
            ...(unstable_nativeProps ? { nativeProps: unstable_nativeProps } : {}),
            ...(disableTransparentOnScrollEdge !== undefined ? { disableTransparentOnScrollEdge } : {}),
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
        if (props.selectedStyle) {
            options.selectedLabelStyle = react_native_1.StyleSheet.flatten(props.selectedStyle);
        }
    }
}
function appendIconOptions(options, props) {
    if ('sf' in props && props.sf && process.env.EXPO_OS === 'ios') {
        if (typeof props.sf === 'string') {
            options.icon = props.sf
                ? {
                    sf: props.sf,
                }
                : undefined;
            options.selectedIcon = undefined;
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
    else if ('xcasset' in props && props.xcasset && process.env.EXPO_OS === 'ios') {
        if (typeof props.xcasset === 'string') {
            options.icon = { xcasset: props.xcasset };
            options.selectedIcon = undefined;
        }
        else {
            options.icon = props.xcasset.default ? { xcasset: props.xcasset.default } : undefined;
            options.selectedIcon = props.xcasset.selected
                ? { xcasset: props.xcasset.selected }
                : undefined;
        }
    }
    else if ('drawable' in props && props.drawable && process.env.EXPO_OS === 'android') {
        if ('md' in props) {
            console.warn('Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.');
        }
        options.icon = { drawable: props.drawable };
        options.selectedIcon = undefined;
    }
    else if ('md' in props && props.md && process.env.EXPO_OS === 'android') {
        if (process.env.NODE_ENV !== 'production') {
            if ('drawable' in props) {
                console.warn('Both `md` and `drawable` props are provided to NativeTabs.Trigger.Icon. `drawable` will take precedence on Android platform.');
            }
        }
        options.icon = (0, materialIconConverter_1.convertMaterialIconNameToImageSource)(props.md);
    }
    else if ('src' in props && props.src) {
        const icon = convertIconSrcToIconOption(props);
        options.icon = icon?.icon;
        options.selectedIcon = icon?.selectedIcon;
    }
    if (props.selectedColor) {
        options.selectedIconColor = props.selectedColor;
    }
}
function convertIconSrcToIconOption(icon) {
    if (icon && icon.src) {
        const { defaultIcon, selected } = typeof icon.src === 'object' && 'selected' in icon.src
            ? { defaultIcon: icon.src.default, selected: icon.src.selected }
            : { defaultIcon: icon.src };
        const options = {};
        options.icon = convertSrcOrComponentToSrc(defaultIcon, { renderingMode: icon.renderingMode });
        options.selectedIcon = convertSrcOrComponentToSrc(selected, {
            renderingMode: icon.renderingMode,
        });
        return options;
    }
    return undefined;
}
function convertSrcOrComponentToSrc(src, options) {
    if (src) {
        if ((0, react_1.isValidElement)(src)) {
            return (0, icon_1.convertComponentSrcToImageSource)(src);
        }
        else {
            return { src, renderingMode: options.renderingMode };
        }
    }
    return undefined;
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