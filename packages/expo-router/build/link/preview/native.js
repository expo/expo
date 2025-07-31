"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeLinkPreviewAction = NativeLinkPreviewAction;
exports.NativeLinkPreviewTrigger = NativeLinkPreviewTrigger;
exports.NativeLinkPreview = NativeLinkPreview;
exports.NativeLinkPreviewContent = NativeLinkPreviewContent;
const expo_1 = require("expo");
const react_native_1 = require("react-native");
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && global.RN$Bridgeless === true;
const LinkPreviewNativeActionView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
function NativeLinkPreviewAction(props) {
    if (!LinkPreviewNativeActionView) {
        return null;
    }
    return <LinkPreviewNativeActionView {...props}/>;
}
const NativeLinkPreviewTriggerView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewTrigger')
    : null;
function NativeLinkPreviewTrigger(props) {
    if (!NativeLinkPreviewTriggerView) {
        return null;
    }
    return <NativeLinkPreviewTriggerView {...props}/>;
}
const NativeLinkPreviewView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewView')
    : null;
function NativeLinkPreview(props) {
    if (!NativeLinkPreviewView) {
        return null;
    }
    return <NativeLinkPreviewView {...props}/>;
}
const NativeLinkPreviewContentView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewContentView')
    : null;
function NativeLinkPreviewContent(props) {
    if (!NativeLinkPreviewContentView) {
        return null;
    }
    const style = react_native_1.StyleSheet.flatten([
        props.style,
        {
            position: 'absolute',
        },
    ]);
    return <NativeLinkPreviewContentView {...props} style={style}/>;
}
// #endregion
//# sourceMappingURL=native.js.map