import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import PropTypes from 'prop-types';
import * as React from 'react';
import { findNodeHandle, ViewPropTypes } from 'react-native';
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
        let { style, ...props } = this.props;
        return (<NativeBlurView {...props} ref={this._setNativeRef} style={[style, { backgroundColor: 'transparent' }]}/>);
    }
}
BlurView.propTypes = {
    ...ViewPropTypes,
    tint: PropTypes.oneOf(['light', 'default', 'dark']).isRequired,
    intensity: PropTypes.number.isRequired,
};
BlurView.defaultProps = {
    tint: 'default',
    intensity: 50,
};
const NativeBlurView = requireNativeViewManager('ExpoBlurView');
//# sourceMappingURL=BlurView.ios.js.map