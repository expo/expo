import { NativeModulesProxy, requireNativeViewManager } from 'expo-modules-core';
import * as React from 'react';
import { findNodeHandle, View, StyleSheet } from 'react-native';
export default class BlurView extends React.Component {
    static defaultProps = {
        tint: 'default',
        intensity: 50,
    };
    _root = null;
    _setNativeRef = (ref) => {
        this._root = ref;
    };
    setNativeProps = (nativeProps) => {
        if (this._root) {
            NativeModulesProxy.ExpoBlurViewManager.updateProps(nativeProps, findNodeHandle(this._root));
        }
    };
    render() {
        const { tint, intensity, style, children, ...props } = this.props;
        return (React.createElement(View, { ...props, style: [style, { backgroundColor: 'transparent' }] },
            React.createElement(NativeBlurView, { tint: tint, intensity: intensity, ref: this._setNativeRef, style: StyleSheet.absoluteFill }),
            children));
    }
}
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
//# sourceMappingURL=BlurView.js.map