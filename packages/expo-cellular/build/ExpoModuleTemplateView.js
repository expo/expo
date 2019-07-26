import * as React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
export default class ExpoCellularView extends React.Component {
    render() {
        return (<ExpoCellularView.NativeView />);
    }
}
ExpoCellularView.NativeView = requireNativeViewManager('ExpoCellularView');
//# sourceMappingURL=ExpoModuleTemplateView.js.map