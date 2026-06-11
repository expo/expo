"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarButton = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("../../../../toolbar/native");
/**
 * Native toolbar button component for bottom toolbar.
 * Renders as RouterToolbarItem.
 */
const NativeToolbarButton = (props) => {
    const id = (0, react_1.useId)();
    const renderingMode = props.imageRenderingMode ?? (props.tintColor !== undefined ? 'template' : 'original');
    if (process.env.NODE_ENV !== 'production' && props.source) {
        console.warn('Stack.Toolbar.Button in placement="bottom" on iOS does not support image icons via the `icon` prop or <Stack.Toolbar.Icon src={...} />; the image will not render. Use the `icon` prop with a string SF Symbol name (e.g. "star.fill"), the `image` prop for a custom image, or <Stack.Toolbar.Icon xcasset="..." /> for an Xcode asset catalog image.');
    }
    return ((0, jsx_runtime_1.jsx)(native_1.RouterToolbarItem, { accessibilityHint: props.accessibilityHint, accessibilityLabel: props.accessibilityLabel, barButtonItemStyle: props.variant === 'done' ? 'prominent' : props.variant, disabled: props.disabled, hidden: props.hidden, hidesSharedBackground: props.hidesSharedBackground, identifier: id, image: props.image, imageRenderingMode: renderingMode, onSelected: props.onPress, possibleTitles: props.possibleTitles, selected: props.selected, sharesBackground: !props.separateBackground, systemImageName: props.icon, xcassetName: props.xcassetName, title: props.label, tintColor: props.tintColor, titleStyle: react_native_1.StyleSheet.flatten(props.style) }));
};
exports.NativeToolbarButton = NativeToolbarButton;
//# sourceMappingURL=native.ios.js.map