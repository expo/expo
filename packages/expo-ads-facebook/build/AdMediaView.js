import { requireNativeViewManager } from '@unimodules/core';
import nullthrows from 'nullthrows';
import React from 'react';
import { AdMediaViewContext } from './withNativeAd';
export default class AdMediaView extends React.Component {
    render() {
        return (React.createElement(AdMediaViewContext.Consumer, null, (contextValue) => {
            const context = nullthrows(contextValue);
            return React.createElement(NativeAdMediaView, Object.assign({}, this.props, { ref: context.nativeRef }));
        }));
    }
}
export const NativeAdMediaView = requireNativeViewManager('MediaView');
//# sourceMappingURL=AdMediaView.js.map