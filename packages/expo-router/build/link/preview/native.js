"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeLinkPreviewAction = NativeLinkPreviewAction;
exports.NativeLinkPreview = NativeLinkPreview;
exports.LinkPreviewNativeZoomTransitionEnabler = LinkPreviewNativeZoomTransitionEnabler;
exports.LinkPreviewNativeZoomTransitionSource = LinkPreviewNativeZoomTransitionSource;
exports.RouterToolbarHost = RouterToolbarHost;
exports.RouterToolbarItem = RouterToolbarItem;
exports.NativeLinkPreviewContent = NativeLinkPreviewContent;
const expo_1 = require("expo");
const react_native_1 = require("react-native");
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && !react_native_1.Platform.isTV && global.RN$Bridgeless === true;
const LinkPreviewNativeActionView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
function NativeLinkPreviewAction(props) {
    if (!LinkPreviewNativeActionView) {
        return null;
    }
    return <LinkPreviewNativeActionView {...props}/>;
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
// #endregion
const LinkPreviewNativeZoomTransitionEnablerView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeZoomTransitionEnabler')
    : null;
function LinkPreviewNativeZoomTransitionEnabler(props) {
    if (!LinkPreviewNativeZoomTransitionEnablerView) {
        return null;
    }
    return (<LinkPreviewNativeZoomTransitionEnablerView {...props} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
        }}/>);
}
const LinkPreviewNativeZoomTransitionSourceView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeZoomTransitionSource')
    : null;
function LinkPreviewNativeZoomTransitionSource(props) {
    if (!LinkPreviewNativeZoomTransitionSourceView) {
        return null;
    }
    return (<LinkPreviewNativeZoomTransitionSourceView {...props} style={{ display: 'contents' }} disableForceFlatten/>);
}
const RouterToolbarHostView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'RouterToolbarHost')
    : null;
function RouterToolbarHost(props) {
    if (!RouterToolbarHostView) {
        return null;
    }
    return (<RouterToolbarHostView {...props} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1,
            height: 1,
            backgroundColor: 'transparent',
        }}/>);
}
const RouterToolbarItemView = areNativeViewsAvailable
    ? (0, expo_1.requireNativeView)('ExpoRouterNativeLinkPreview', 'RouterToolbarItem')
    : null;
function RouterToolbarItem(props) {
    if (!RouterToolbarItemView) {
        return null;
    }
    return <RouterToolbarItemView {...props} type={props.spacer ? 'spacer' : ''}/>;
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
    return <NativeLinkPreviewContentView {...props} style={style}/>;
}
// #endregion
//# sourceMappingURL=native.js.map