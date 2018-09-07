// @flow

import * as React from 'react';
import { View, ViewPropTypes, TouchableOpacity } from 'react-native';

import { TriggerableContext } from './withNativeAd';
import type { TriggerableContextValueType } from './withNativeAd';

type PropsType = ViewPropTypes & TriggerableContextValueType;

class TriggerableViewChild extends React.Component<PropsType> {
  _wrapperRef: ?View;

  _handleWrapperRef = (ref: ?View) => {
    if (this._wrapperRef) {
      this.props.unregister(this._wrapperRef);
      this._wrapperRef = null;
    }

    if (ref) {
      this.props.register(ref);
      this._wrapperRef = ref;
    }
  };

  render() {
    return (
      <TouchableOpacity
        {...this.props}
        ref={this._handleWrapperRef}
        collapsable={false}
        onPress={this.props.onTriggerEvent}
      />
    );
  }
}

export default class TriggerableView extends React.Component<ViewPropTypes> {
  render() {
    return (
      <TriggerableContext.Consumer>
        {(contextValue: TriggerableContextValueType) => (
          <TriggerableViewChild {...this.props} {...contextValue} />
        )}
      </TriggerableContext.Consumer>
    );
  }
}
