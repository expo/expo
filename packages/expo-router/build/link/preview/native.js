'use client';
import { requireNativeView } from 'expo';
import { Fragment } from 'react';
import { Platform, StyleSheet } from 'react-native';
// TODO(@kitten): Replace with `globalThis`, add typings in `expo`
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;
const LinkPreviewNativeActionView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
export function NativeLinkPreviewAction(props) {
    if (!LinkPreviewNativeActionView) {
        return null;
    }
    // Needed to pass shared object ID to native side
    const imageObjectId = props.image?.__expo_shared_object_id__;
    return <LinkPreviewNativeActionView {...props} image={imageObjectId}/>;
}
const NativeLinkPreviewView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewView')
    : null;
export function NativeLinkPreview(props) {
    if (!NativeLinkPreviewView) {
        return null;
    }
    return <NativeLinkPreviewView {...props}/>;
}
const NativeLinkPreviewContentView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'NativeLinkPreviewContentView')
    : null;
export function NativeLinkPreviewContent(props) {
    if (!NativeLinkPreviewContentView) {
        return null;
    }
    const style = StyleSheet.flatten([
        props.style,
        {
            position: 'absolute',
            top: 0,
            left: 0,
        },
    ]);
    return <NativeLinkPreviewContentView {...props} style={style}/>;
}
const LinkZoomTransitionEnablerNativeView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionEnabler')
    : null;
export function LinkZoomTransitionEnabler(props) {
    if (!LinkZoomTransitionEnablerNativeView) {
        return null;
    }
    return (<LinkZoomTransitionEnablerNativeView {...props} disableForceFlatten style={{ display: 'contents' }}/>);
}
const LinkZoomTransitionSourceNativeView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionSource')
    : null;
export function LinkZoomTransitionSource(props) {
    if (!LinkZoomTransitionSourceNativeView) {
        return null;
    }
    return (<LinkZoomTransitionSourceNativeView {...props} disableForceFlatten collapsable={false} collapsableChildren={false} style={{ display: 'contents' }}/>);
}
// #endregion
// #region Zoom transition rect detector
const LinkZoomTransitionAlignmentRectDetectorNative = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkZoomTransitionAlignmentRectDetector')
    : Fragment;
export function LinkZoomTransitionAlignmentRectDetector(props) {
    if (!LinkZoomTransitionAlignmentRectDetectorNative) {
        return null;
    }
    return (<LinkZoomTransitionAlignmentRectDetectorNative {...props} disableForceFlatten collapsable={false} collapsableChildren={false} style={{ display: 'contents' }}/>);
}
//# sourceMappingURL=native.js.map