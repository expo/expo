import nullthrows from 'nullthrows';
import React from 'react';
import { requireNativeViewManager } from '@unimodules/core';
import { AdIconViewContext } from './withNativeAd';
export default class AdIconView extends React.Component {
    render() {
        return (<AdIconViewContext.Consumer>
        {(contextValue) => {
            let context = nullthrows(contextValue);
            return <NativeAdIconView {...this.props} ref={context.nativeRef}/>;
        }}
      </AdIconViewContext.Consumer>);
    }
}
export const NativeAdIconView = requireNativeViewManager('AdIconView');
//# sourceMappingURL=AdIconView.js.map