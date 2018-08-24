// @flow

import * as React from 'react';
import { requireNativeComponent, ViewPropTypes } from 'react-native';

import { AdIconViewContext } from './withNativeAd';
import type { AdIconViewContextValueType } from './withNativeAd';

export const NativeAdIconView = requireNativeComponent('AdIconView', null, {});

type PropsType = ViewPropTypes & AdIconViewContextValueType;

class AdIconViewChild extends React.Component<PropsType> {
  _nativeAdIconViewRef: ?React.Node;

  _handleAdIconViewRef = (ref: ?NativeAdIconView) => {
    if (this._nativeAdIconViewRef) {
      this.props.unregister(this._nativeAdIconViewRef);
      this._nativeAdIconViewRef = null;
    }

    if (ref) {
      this.props.register(ref);
      this._nativeAdIconViewRef = ref;
    }
  };

  render() {
    return <NativeAdIconView {...this.props} ref={this._handleAdIconViewRef} />;
  }
}

class AdIconView extends React.Component<ViewPropTypes> {
  render() {
    return (
      <AdIconViewContext.Consumer>
        {(contextValue: AdIconViewContextValueType) => (
          <AdIconViewChild {...this.props} {...contextValue} />
        )}
      </AdIconViewContext.Consumer>
    );
  }
}

export default AdIconView;
