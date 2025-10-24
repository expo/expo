"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeader = exports.ScreenOptionsContext = exports.ScreensOptionsContext = exports.StackHeaderConfigurationContext = void 0;
exports.StackScreen = StackScreen;
exports.StackProtected = StackProtected;
const react_1 = require("react");
const react_native_1 = require("react-native");
const Screen_1 = require("../views/Screen");
exports.StackHeaderConfigurationContext = (0, react_1.createContext)(undefined);
function StackHeaderComponent({ asChild, children, hidden, blurEffect, style, largeStyle, }) {
    const contextValue = (0, react_1.use)(exports.ScreenOptionsContext);
    if (!contextValue) {
        throw new Error('Stack.Header can only be used inside of a Stack.Screen component in a _layout file.');
    }
    const { configuration, setConfiguration } = contextValue;
    const setHeaderBackButtonConfiguration = (config) => {
        setConfiguration((prev) => ({ ...prev, ...config }));
    };
    const setHeaderLeftConfiguration = (config) => {
        setConfiguration((prev) => ({ ...prev, ...config }));
    };
    const setHeaderRightConfiguration = (config) => {
        setConfiguration((prev) => ({ ...prev, ...config }));
    };
    const setHeaderSearchBarConfiguration = (config) => {
        setConfiguration((prev) => ({ ...prev, ...config }));
    };
    const setHeaderTitleConfiguration = (config) => {
        setConfiguration((prev) => ({ ...prev, ...config }));
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
    (0, react_1.useEffect)(() => {
        if (hidden) {
            setConfiguration((prev) => ({ ...prev, headerShown: false }));
        }
        else if (asChild) {
            setConfiguration((prev) => ({ ...prev, header: () => children }));
        }
        else {
            setConfiguration((prev) => ({ ...prev, ...currentConfig }));
        }
    }, [asChild, hidden, currentConfig]);
    if (asChild) {
        return null;
    }
    return (<exports.StackHeaderConfigurationContext value={{
            configuration,
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
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
    (0, react_1.useEffect)(() => {
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
function StackScreen({ name, options, children, ...rest }) {
    const contextValue = (0, react_1.use)(exports.ScreensOptionsContext);
    const isWithinProtected = (0, react_1.use)(IsWithinProtected);
    const [configuration, setConfiguration] = (0, react_1.useState)({});
    if (contextValue && !name) {
        throw new Error('A name prop is required for Stack.Screen when used inside of a Stack navigator.');
    }
    (0, react_1.useEffect)(() => {
        if (contextValue && name) {
            contextValue.addScreenConfiguration(name, { ...options, ...configuration });
            return () => {
                contextValue.removeScreenConfiguration(name);
            };
        }
        return undefined;
    }, [name]);
    (0, react_1.useEffect)(() => {
        if (contextValue && name) {
            contextValue.setScreenProps(name, rest);
            return () => {
                contextValue.removeScreenProps(name);
            };
        }
        return undefined;
    }, [name]);
    (0, react_1.useEffect)(() => {
        if (contextValue && name && isWithinProtected) {
            contextValue.addProtectedScreen(name);
            return () => {
                contextValue.removeProtectedScreen(name);
            };
        }
        return undefined;
    }, [name, isWithinProtected]);
    (0, react_1.useEffect)(() => {
        if (contextValue && name) {
            contextValue.updateScreenConfiguration(name, { ...options, ...configuration });
        }
    }, [...Object.values(options ?? {}), configuration]);
    if (!contextValue) {
        return <Screen_1.Screen name={name} options={{ ...options }}/>;
    }
    return (<exports.ScreenOptionsContext value={{ configuration, setConfiguration }}>
      {children}
    </exports.ScreenOptionsContext>);
}
const IsWithinProtected = (0, react_1.createContext)(false);
function StackProtected({ guard, children }) {
    if (!guard) {
        return <IsWithinProtected value>{children}</IsWithinProtected>;
    }
    return <>{children}</>;
}
exports.StackHeader = Object.assign(StackHeaderComponent, {
    Left: StackHeaderLeft,
    Right: StackHeaderRight,
    BackButton: StackHeaderBackButton,
    Title: StackHeaderTitle,
    SearchBar: StackHeaderSearchBar,
});
//# sourceMappingURL=StackElements.js.map