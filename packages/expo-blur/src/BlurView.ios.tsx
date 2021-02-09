import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';
import * as React from 'react';
import { findNodeHandle, View, StyleSheet } from 'react-native';

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
    const { tint, intensity, style, children, ...props } = this.props;
    return (
      <View {...props} style={[style, { backgroundColor: 'transparent' }]}>
        <NativeBlurView
          tint={tint}
          intensity={intensity}
          ref={this._setNativeRef}
          style={StyleSheet.absoluteFill}
        />
        {children}
      </View>
    );
  }
}

const NativeBlurView = requireNativeViewManager('ExpoBlurView');
