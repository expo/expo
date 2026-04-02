"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeToolbarButton = void 0;
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
    return (<native_1.RouterToolbarItem accessibilityHint={props.accessibilityHint} accessibilityLabel={props.accessibilityLabel} barButtonItemStyle={props.variant === 'done' ? 'prominent' : props.variant} disabled={props.disabled} hidden={props.hidden} hidesSharedBackground={props.hidesSharedBackground} identifier={id} image={props.image} imageRenderingMode={renderingMode} onSelected={props.onPress} possibleTitles={props.possibleTitles} selected={props.selected} sharesBackground={!props.separateBackground} systemImageName={props.icon} xcassetName={props.xcassetName} title={props.label} tintColor={props.tintColor} titleStyle={react_native_1.StyleSheet.flatten(props.style)}/>);
};
exports.NativeToolbarButton = NativeToolbarButton;
//# sourceMappingURL=native.ios.js.map