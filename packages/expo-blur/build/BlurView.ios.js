import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle, View, StyleSheet } from 'react-native';
export default class BlurView extends React.Component {
    constructor() {
        super(...arguments);
        this._root = null;
        this._setNativeRef = (ref) => {
            this._root = ref;
        };
        this.setNativeProps = nativeProps => {
            if (this._root) {
                NativeModulesProxy.ExpoBlurViewManager.updateProps(nativeProps, findNodeHandle(this._root));
            }
        };
    }
    render() {
        const { tint, intensity, style, children, ...props } = this.props;
        return (React.createElement(View, Object.assign({}, props, { style: [style, { backgroundColor: 'transparent' }] }),
            React.createElement(NativeBlurView, { tint: tint, intensity: intensity, ref: this._setNativeRef, style: StyleSheet.absoluteFill }),
            children));
    }
}
BlurView.defaultProps = {
    tint: 'default',
    intensity: 50,
};
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
//# sourceMappingURL=BlurView.ios.js.map