import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes, findNodeHandle } from 'react-native';
import { NativeModulesProxy, requireNativeViewManager } from '@unimodules/core';

type Props = {
  tint: BlurTint;
  intensity: number;
} & React.ComponentProps<typeof View>;
type BlurTint = 'light' | 'dark' | 'default';

type ComponentOrHandle = null | number | React.Component<any, any> | React.ComponentClass<any>;

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    ...ViewPropTypes,
    tint: PropTypes.oneOf(['light', 'default', 'dark'] as BlurTint[]).isRequired,
    intensity: PropTypes.number.isRequired,
  };

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
    let { style, ...props } = this.props;
    return <NativeBlurView {...props} ref={this._setNativeRef} style={[style, { backgroundColor: 'transparent' }]} />;
  }
}

const NativeBlurView = requireNativeViewManager('ExpoBlurView');
