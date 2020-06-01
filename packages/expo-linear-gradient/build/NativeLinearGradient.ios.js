import { requireNativeViewManager } from '@unimodules/core';
import React from 'react';
export default class NativeLinearGradient extends React.PureComponent {
    render() {
        return React.createElement(BaseNativeLinearGradient, Object.assign({}, this.props));
    }
}
const BaseNativeLinearGradient = requireNativeViewManager('ExpoLinearGradient');
//# sourceMappingURL=NativeLinearGradient.ios.js.map