'use client';
import { requireNativeView } from 'expo';
import { Platform, StyleSheet } from 'react-native';
const areNativeViewsAvailable = process.env.EXPO_OS === 'ios' && !Platform.isTV && global.RN$Bridgeless === true;
const LinkPreviewNativeActionView = areNativeViewsAvailable
    ? requireNativeView('ExpoRouterNativeLinkPreview', 'LinkPreviewNativeActionView')
    : null;
export function NativeLinkPreviewAction(props) {
    if (!LinkPreviewNativeActionView) {
        return null;
    }
    return <LinkPreviewNativeActionView {...props}/>;
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
//# sourceMappingURL=native.js.map