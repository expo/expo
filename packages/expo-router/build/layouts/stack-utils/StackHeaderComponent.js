"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderComponent = StackHeaderComponent;
exports.appendStackHeaderPropsToOptions = appendStackHeaderPropsToOptions;
const react_1 = require("react");
const react_native_1 = require("react-native");
const StackHeaderBackButton_1 = require("./StackHeaderBackButton");
const StackHeaderLeftRight_1 = require("./StackHeaderLeftRight");
const StackHeaderSearchBar_1 = require("./StackHeaderSearchBar");
const StackHeaderTitle_1 = require("./StackHeaderTitle");
const utils_1 = require("./utils");
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
        let updatedOptions = options;
        if ((0, utils_1.isChildOfType)(child, StackHeaderTitle_1.StackHeaderTitle)) {
            updatedOptions = (0, StackHeaderTitle_1.appendStackHeaderTitlePropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, StackHeaderLeftRight_1.StackHeaderLeft)) {
            updatedOptions = (0, StackHeaderLeftRight_1.appendStackHeaderLeftPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, StackHeaderLeftRight_1.StackHeaderRight)) {
            updatedOptions = (0, StackHeaderLeftRight_1.appendStackHeaderRightPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, StackHeaderBackButton_1.StackHeaderBackButton)) {
            updatedOptions = (0, StackHeaderBackButton_1.appendStackHeaderBackButtonPropsToOptions)(updatedOptions, child.props);
        }
        else if ((0, utils_1.isChildOfType)(child, StackHeaderSearchBar_1.StackHeaderSearchBar)) {
            updatedOptions = (0, StackHeaderSearchBar_1.appendStackHeaderSearchBarPropsToOptions)(updatedOptions, child.props);
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