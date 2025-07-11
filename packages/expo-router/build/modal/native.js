"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeModalPortalHost = NativeModalPortalHost;
exports.NativeModalPortalContentWrapper = NativeModalPortalContentWrapper;
exports.NativeModalPortalContent = NativeModalPortalContent;
const expo_1 = require("expo");
const react_native_1 = require("react-native");
const supportedPlatforms = ['ios', 'android'];
const isPlatformSupported = supportedPlatforms.includes(react_native_1.Platform.OS);
const NativeModalPortalHostView = isPlatformSupported
    ? (0, expo_1.requireNativeView)('ExpoRouterModalPortal', 'ModalPortalHostView')
    : null;
function NativeModalPortalHost(props) {
    if (!NativeModalPortalHostView) {
        return null;
    }
    return <NativeModalPortalHostView {...props}/>;
}
const NativeModalPortalContentWrapperView = isPlatformSupported
    ? (0, expo_1.requireNativeView)('ExpoRouterModalPortal', 'ModalPortalContentWrapperView')
    : null;
function NativeModalPortalContentWrapper(props) {
    if (!NativeModalPortalContentWrapperView) {
        return null;
    }
    return <NativeModalPortalContentWrapperView {...props} style={{ position: 'absolute' }}/>;
}
const NativeModalPortalContentView = isPlatformSupported
    ? (0, expo_1.requireNativeView)('ExpoRouterModalPortal', 'ModalPortalContentView')
    : null;
function NativeModalPortalContent(props) {
    if (!NativeModalPortalContentView) {
        return null;
    }
    return <NativeModalPortalContentView {...props}/>;
}
// #endregion
//# sourceMappingURL=native.js.map