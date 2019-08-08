import React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class NativeLinearGradient extends React.PureComponent {
    render() {
        return <BaseNativeLinearGradient {...this.props}/>;
    }
}
const BaseNativeLinearGradient = requireNativeViewManager('ExpoLinearGradient');
//# sourceMappingURL=NativeLinearGradient.ios.js.map