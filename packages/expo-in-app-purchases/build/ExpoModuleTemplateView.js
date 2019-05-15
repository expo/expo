import * as React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class ExpoInAppPurchasesView extends React.Component {
    render() {
        return (<ExpoInAppPurchasesView.NativeView />);
    }
}
ExpoInAppPurchasesView.NativeView = requireNativeViewManager('ExpoInAppPurchasesView');
//# sourceMappingURL=ExpoModuleTemplateView.js.map