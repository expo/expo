import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle } from 'react-native';

import { BlurProps, BlurTint, ComponentOrHandle } from './BlurView.types';

export default class BlurView extends React.Component<BlurProps> {
  static defaultProps = {
    tint: 'default' as BlurTint,
    intensity: 50,
  };

  _root: ComponentOrHandle = null;

  _setNativeRef = (ref: ComponentOrHandle) => {
    this._root = ref;
  };

  setNativeProps = nativeProps => {
    if (this._root) {
      NativeModulesProxy.ExpoBlurViewManager.updateProps(nativeProps, findNodeHandle(this._root));
    }
  };

  render() {
    const { style, ...props } = this.props;
    return (
      <NativeBlurView
        {...props}
        ref={this._setNativeRef}
        style={[style, { backgroundColor: 'transparent' }]}
      />
    );
  }
}

const NativeBlurView = requireNativeViewManager('ExpoBlurView');
