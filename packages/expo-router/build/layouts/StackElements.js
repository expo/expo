"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeader = void 0;
exports.appendScreenStackPropsToOptions = appendScreenStackPropsToOptions;
exports.StackScreen = StackScreen;
const react_1 = require("react");
const react_native_1 = require("react-native");
const Screen_1 = require("../views/Screen");
function StackHeaderComponent(props) {
    return null;
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
        if (child.type === StackHeaderTitle) {
            updatedOptions = appendStackHeaderTitlePropsToOptions(updatedOptions, child.props);
        }
        else if (child.type === StackHeaderLeft) {
            updatedOptions = appendStackHeaderLeftPropsToOptions(updatedOptions, child.props);
        }
        else if (child.type === StackHeaderRight) {
            updatedOptions = appendStackHeaderRightPropsToOptions(updatedOptions, child.props);
        }
        else if (child.type === StackHeaderBackButton) {
            updatedOptions = appendStackHeaderBackButtonPropsToOptions(updatedOptions, child.props);
        }
        else if (child.type === StackHeaderSearchBar) {
            updatedOptions = appendStackHeaderSearchBarPropsToOptions(updatedOptions, child.props);
        }
        else {
            updatedOptions = processUnknownChild(updatedOptions, child, appendChildOptions);
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
function StackHeaderLeft(props) {
    return null;
}
function appendStackHeaderLeftPropsToOptions(options, props) {
    if (!props.asChild) {
        return options;
    }
    return {
        ...options,
        headerLeft: () => props.children,
    };
}
function StackHeaderRight(props) {
    return null;
}
function appendStackHeaderRightPropsToOptions(options, props) {
    if (!props.asChild) {
        return options;
    }
    return {
        ...options,
        headerRight: () => props.children,
    };
}
function StackHeaderBackButton(props) {
    return null;
}
function appendStackHeaderBackButtonPropsToOptions(options, props) {
    return {
        ...options,
        headerBackTitle: props.children,
        headerBackTitleStyle: props.style,
        headerBackImageSource: props.src,
        headerBackButtonDisplayMode: props.displayMode,
        headerBackButtonMenuEnabled: props.withMenu,
        headerBackVisible: !props.hidden,
    };
}
function StackHeaderTitle(props) {
    return null;
}
function appendStackHeaderTitlePropsToOptions(options, props) {
    const flattenedStyle = react_native_1.StyleSheet.flatten(props.style);
    const flattenedLargeStyle = react_native_1.StyleSheet.flatten(props.largeStyle);
    return {
        ...options,
        headerTitle: props.children,
        headerLargeTitle: props.large,
        headerTitleAlign: flattenedStyle?.textAlign,
        headerTitleStyle: {
            ...flattenedStyle,
            color: flattenedStyle?.color ?? undefined,
        },
        headerLargeTitleStyle: {
            ...flattenedLargeStyle,
            fontWeight: flattenedLargeStyle?.fontWeight?.toString(),
            color: flattenedLargeStyle?.color ?? undefined,
        },
    };
}
function appendStackHeaderSearchBarPropsToOptions(options, props) {
    return {
        ...options,
        headerSearchBarOptions: {
            ...props,
        },
    };
}
function StackHeaderSearchBar(props) {
    return null;
}
function appendScreenStackPropsToOptions(options, props) {
    let updatedOptions = { ...options, ...props.options };
    function appendChildOptions(child, options) {
        if (child.type === exports.StackHeader) {
            updatedOptions = appendStackHeaderPropsToOptions(options, child.props);
        }
        else {
            updatedOptions = processUnknownChild(options, child, appendChildOptions);
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
function StackScreen({ children, ...rest }) {
    return <Screen_1.Screen {...rest}/>;
}
exports.StackHeader = Object.assign(StackHeaderComponent, {
    Left: StackHeaderLeft,
    Right: StackHeaderRight,
    BackButton: StackHeaderBackButton,
    Title: StackHeaderTitle,
    SearchBar: StackHeaderSearchBar,
});
function processUnknownChild(options, child, appendChildOptions) {
    if (typeof child.type === 'function') {
        // Handle function components (not class components)
        const type = child.type;
        const isClassComponent = !!type.prototype?.isReactComponent;
        if (!isClassComponent) {
            const renderedChildren = type(child.props);
            react_1.Children.forEach(renderedChildren, (grandChild) => {
                if ((0, react_1.isValidElement)(grandChild)) {
                    options = appendChildOptions(grandChild, options);
                }
            });
        }
    }
    return options;
}
//# sourceMappingURL=StackElements.js.map