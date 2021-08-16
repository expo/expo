import { requireNativeViewManager } from 'expo-modules-core';
import nullthrows from 'nullthrows';
import React from 'react';
import { AdMediaViewContext } from './withNativeAd';
export default class AdMediaView extends React.Component {
    render() {
        return (React.createElement(AdMediaViewContext.Consumer, null, (contextValue) => {
            const context = nullthrows(contextValue);
            return React.createElement(NativeAdMediaView, { ...this.props, ref: context.nativeRef });
        }));
    }
}
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the type and variable share a name
export const NativeAdMediaView = requireNativeViewManager('MediaView');
//# sourceMappingURL=AdMediaView.js.map