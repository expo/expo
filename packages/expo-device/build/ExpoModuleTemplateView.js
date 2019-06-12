import * as React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class ExpoDeviceInfoView extends React.Component {
    render() {
        return (<ExpoDeviceInfoView.NativeView />);
    }
}
ExpoDeviceInfoView.NativeView = requireNativeViewManager('ExpoDeviceInfoView');
//# sourceMappingURL=ExpoModuleTemplateView.js.map