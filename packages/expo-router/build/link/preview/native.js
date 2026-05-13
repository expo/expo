"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeLinkPreviewAction = NativeLinkPreviewAction;
exports.NativeLinkPreview = NativeLinkPreview;
exports.NativeLinkPreviewContent = NativeLinkPreviewContent;
exports.LinkZoomTransitionEnabler = LinkZoomTransitionEnabler;
exports.LinkZoomTransitionSource = LinkZoomTransitionSource;
exports.LinkZoomTransitionAlignmentRectDetector = LinkZoomTransitionAlignmentRectDetector;
const jsx_runtime_1 = require("react/jsx-runtime");
const expo_1 = require("expo");
const react_1 = require("react");
const react_native_1 = require("react-native");
// TODO(@kitten): Replace with `globalThis`, add typings in `expo`
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && !react_native_1.Platform.isTV && global.RN$Bridgeless === true;
const LinkPreviewNativeActionView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
function NativeLinkPreviewAction(props) {
    if (!LinkPreviewNativeActionView) {
        return null;
    }
    // Needed to pass shared object ID to native side
    const imageObjectId = props.image?.__expo_shared_object_id__;
    return (0, jsx_runtime_1.jsx)(LinkPreviewNativeActionView, { ...props, image: imageObjectId });
}
const NativeLinkPreviewView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewView')
    : null;
function NativeLinkPreview(props) {
    if (!NativeLinkPreviewView) {
        return null;
    }
    return (0, jsx_runtime_1.jsx)(NativeLinkPreviewView, { ...props });
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
            top: 0,
            left: 0,
        },
    ]);
    return (0, jsx_runtime_1.jsx)(NativeLinkPreviewContentView, { ...props, style: style });
}
const LinkZoomTransitionEnablerNativeView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionEnabler')
    : null;
function LinkZoomTransitionEnabler(props) {
    if (!LinkZoomTransitionEnablerNativeView) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(LinkZoomTransitionEnablerNativeView, { ...props, disableForceFlatten: true, style: { display: 'contents' } }));
}
const LinkZoomTransitionSourceNativeView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionSource')
    : null;
function LinkZoomTransitionSource(props) {
    if (!LinkZoomTransitionSourceNativeView) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(LinkZoomTransitionSourceNativeView, { ...props, disableForceFlatten: true, collapsable: false, collapsableChildren: false, style: { display: 'contents' } }));
}
// #endregion
// #region Zoom transition rect detector
const LinkZoomTransitionAlignmentRectDetectorNative = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionAlignmentRectDetector')
    : react_1.Fragment;
function LinkZoomTransitionAlignmentRectDetector(props) {
    if (!LinkZoomTransitionAlignmentRectDetectorNative) {
        return null;
    }
    return ((0, jsx_runtime_1.jsx)(LinkZoomTransitionAlignmentRectDetectorNative, { ...props, disableForceFlatten: true, collapsable: false, collapsableChildren: false, style: { display: 'contents' } }));
}
//# sourceMappingURL=native.js.map