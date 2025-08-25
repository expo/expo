"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBottomAccessory = NativeBottomAccessory;
const expo_1 = require("expo");
const react_native_1 = require("react-native");
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && !react_native_1.Platform.isTV && global.RN$Bridgeless === true;
const NativeBottomAccessoryView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterBottomAccessory', 'BottomAccessoryNativeView')
    : null;
function NativeBottomAccessory(props) {
    if (!NativeBottomAccessoryView) {
        return null;
    }
    return (<NativeBottomAccessoryView {...props} style={react_native_1.StyleSheet.flatten([props.style, { position: 'absolute' }])}/>);
}
//# sourceMappingURL=native.js.map