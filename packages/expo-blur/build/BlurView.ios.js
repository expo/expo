import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';
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
        const { style, tint, intensity } = this.props;
        return (React.createElement(NativeBlurView, { tint: tint, intensity: intensity, ref: this._setNativeRef, style: [style, { backgroundColor: 'transparent' }] }));
    }
}
BlurView.defaultProps = {
    tint: 'default',
    intensity: 50,
};
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
//# sourceMappingURL=BlurView.ios.js.map