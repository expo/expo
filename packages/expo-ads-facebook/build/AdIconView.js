import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { AdIconViewContext } from './withNativeAd';
export default class AdIconView extends React.Component {
    render() {
        return (React.createElement(AdIconViewContext.Consumer, null, (contextValue) => {
            const context = nullthrows(contextValue);
            return React.createElement(NativeAdIconView, { ...this.props, ref: context.nativeRef });
        }));
    }
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
export const NativeAdIconView = requireNativeViewManager('AdIconView');
//# sourceMappingURL=AdIconView.js.map