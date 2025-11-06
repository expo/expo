"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackHeaderBackButton = StackHeaderBackButton;
exports.appendStackHeaderBackButtonPropsToOptions = appendStackHeaderBackButtonPropsToOptions;
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
//# sourceMappingURL=StackHeaderBackButton.js.map