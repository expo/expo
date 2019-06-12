import * as React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class ExpoModuleTemplateView extends React.Component {
    render() {
        return (<ExpoModuleTemplateView.NativeView />);
    }
}
ExpoModuleTemplateView.NativeView = requireNativeViewManager('ExpoModuleTemplateView');
//# sourceMappingURL=ExpoDeviceView.js.map