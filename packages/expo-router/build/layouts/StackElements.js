"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeader = exports.IsWithinCompositionConfiguration = exports.ScreenOptionsContext = exports.ScreensOptionsContext = exports.StackHeaderConfigurationContext = void 0;
exports.StackScreen = StackScreen;
const react_1 = require("react");
const react_native_1 = require("react-native");
const useNavigation_1 = require("../useNavigation");
const Screen_1 = require("../views/Screen");
exports.StackHeaderConfigurationContext = (0, react_1.createContext)(undefined);
function StackHeaderComponent({ asChild, children, hidden, blurEffect, style, largeStyle, }) {
    const contextValue = (0, react_1.use)(exports.ScreenOptionsContext);
    if (!contextValue) {
        throw new Error('Stack.Header can only be used inside of a Stack.Screen component in a _layout file.');
    }
    const { setConfiguration } = contextValue;
    const setHeaderBackButtonConfiguration = (config) => {
        setConfiguration({ ...config });
    };
    const setHeaderLeftConfiguration = (config) => {
        setConfiguration({ ...config });
    };
    const setHeaderRightConfiguration = (config) => {
        setConfiguration({ ...config });
    };
    const setHeaderSearchBarConfiguration = (config) => {
        setConfiguration({ ...config });
    };
    const setHeaderTitleConfiguration = (config) => {
        setConfiguration({ ...config });
    };
    const currentConfig = (0, react_1.useMemo)(() => {
        const flattenedStyle = react_native_1.StyleSheet.flatten(style);
        const flattenedLargeStyle = react_native_1.StyleSheet.flatten(largeStyle);
        return {
            headerShown: !hidden,
            headerBlurEffect: blurEffect,
            headerStyle: {
                backgroundColor: flattenedStyle?.backgroundColor,
            },
            headerLargeStyle: {
                backgroundColor: flattenedLargeStyle?.backgroundColor,
            },
            headerShadowVisible: flattenedStyle?.shadowColor !== 'transparent',
            headerLargeTitleShadowVisible: flattenedLargeStyle?.shadowColor !== 'transparent',
        };
    }, [hidden, blurEffect, style, largeStyle]);
    (0, react_1.useLayoutEffect)(() => {
        if (hidden) {
            setConfiguration({ headerShown: false });
        }
        else if (asChild) {
            setConfiguration({ header: () => children });
        }
        else {
            setConfiguration({ ...currentConfig });
        }
    }, [asChild, hidden, currentConfig]);
    if (asChild) {
        return null;
    }
    return (<exports.StackHeaderConfigurationContext value={{
            setHeaderBackButtonConfiguration,
            setHeaderLeftConfiguration,
            setHeaderRightConfiguration,
            setHeaderSearchBarConfiguration,
            setHeaderTitleConfiguration,
        }}>
      {children}
    </exports.StackHeaderConfigurationContext>);
}
function StackHeaderLeft({ asChild, children }) {
    const contextValue = (0, react_1.use)(exports.StackHeaderConfigurationContext);
    if (!contextValue) {
        throw new Error('Stack.Header.Left can only be used inside of a Stack.Header component in a _layout file.');
    }
    const { setHeaderLeftConfiguration } = contextValue;
    (0, react_1.useLayoutEffect)(() => {
        const config = asChild ? { headerLeft: () => children } : {};
        setHeaderLeftConfiguration(config);
    }, [children, asChild]);
    return null;
}
function StackHeaderRight({ asChild, children }) {
    const contextValue = (0, react_1.use)(exports.StackHeaderConfigurationContext);
    if (!contextValue) {
        throw new Error('Stack.Header.Right can only be used inside of a Stack.Header component in a _layout file.');
    }
    const { setHeaderRightConfiguration } = contextValue;
    (0, react_1.useLayoutEffect)(() => {
        const config = asChild ? { headerRight: () => children } : {};
        setHeaderRightConfiguration(config);
    }, [children, asChild]);
    return null;
}
function StackHeaderBackButton({ children, style, withMenu, displayMode, src, hidden, }) {
    const contextValue = (0, react_1.use)(exports.StackHeaderConfigurationContext);
    if (!contextValue) {
        throw new Error('Stack.Header.BackButton can only be used inside of a Stack.Header component in a _layout file.');
    }
    const { setHeaderBackButtonConfiguration } = contextValue;
    (0, react_1.useLayoutEffect)(() => {
        setHeaderBackButtonConfiguration({
            headerBackTitle: children,
            headerBackTitleStyle: style,
            headerBackImageSource: src,
            headerBackButtonDisplayMode: displayMode,
            headerBackButtonMenuEnabled: withMenu,
            headerBackVisible: !hidden,
        });
    }, []);
    return null;
}
function StackHeaderTitle({ children, style, large, largeStyle }) {
    const contextValue = (0, react_1.use)(exports.StackHeaderConfigurationContext);
    if (!contextValue) {
        throw new Error('Stack.Header.Title can only be used inside of a Stack.Header component in a _layout file.');
    }
    const { setHeaderTitleConfiguration } = contextValue;
    (0, react_1.useLayoutEffect)(() => {
        const flattenedStyle = react_native_1.StyleSheet.flatten(style);
        const flattenedLargeStyle = react_native_1.StyleSheet.flatten(largeStyle);
        setHeaderTitleConfiguration({
            headerTitle: children,
            headerLargeTitle: large,
            headerTitleAlign: flattenedStyle?.textAlign,
            headerTitleStyle: {
                ...flattenedStyle,
                // This is needed because React Navigation expects color to be a string
                color: flattenedStyle?.color ?? undefined,
            },
            headerLargeTitleStyle: {
                ...flattenedLargeStyle,
                fontWeight: flattenedLargeStyle?.fontWeight?.toString(),
                // This is needed because React Navigation expects color to be a string
                color: flattenedLargeStyle?.color ?? undefined,
            },
        });
    }, [children, style, large, largeStyle]);
    return null;
}
function StackHeaderSearchBar(props) {
    const contextValue = (0, react_1.use)(exports.StackHeaderConfigurationContext);
    (0, react_1.useLayoutEffect)(() => {
        if (!contextValue) {
            throw new Error('Stack.Header.SearchBar can only be used inside of a Stack.Header component in a _layout file.');
        }
        const { setHeaderSearchBarConfiguration } = contextValue;
        setHeaderSearchBarConfiguration({
            headerSearchBarOptions: props,
        });
    }, [props]);
    return null;
}
exports.ScreensOptionsContext = (0, react_1.createContext)(undefined);
exports.ScreenOptionsContext = (0, react_1.createContext)(undefined);
exports.IsWithinCompositionConfiguration = (0, react_1.createContext)(false);
function StackScreen({ children, ...rest }) {
    if ((0, react_1.use)(exports.IsWithinCompositionConfiguration)) {
        return <StackScreenInner {...rest} children={children}/>;
    }
    else {
        return <Screen_1.Screen {...rest}/>;
    }
}
function StackScreenInner({ name, options, children, ...rest }) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const setConfiguration = (0, react_1.useCallback)((configUpdater) => {
        navigation.setOptions(configUpdater);
    }, [navigation]);
    return <exports.ScreenOptionsContext value={{ setConfiguration }}>{children}</exports.ScreenOptionsContext>;
}
exports.StackHeader = Object.assign(StackHeaderComponent, {
    Left: StackHeaderLeft,
    Right: StackHeaderRight,
    BackButton: StackHeaderBackButton,
    Title: StackHeaderTitle,
    SearchBar: StackHeaderSearchBar,
});
//# sourceMappingURL=StackElements.js.map