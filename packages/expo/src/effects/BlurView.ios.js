// @flow

import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes, requireNativeComponent } from 'react-native';

type Props = {
  tint: 'light' | 'dark' | 'default',
  intensity: number,
} & React.ElementProps<typeof View>;

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']).isRequired,
    intensity: PropTypes.number.isRequired,
    ...ViewPropTypes,
  };

  static defaultProps = {
    tint: 'default',
    intensity: 50,
  };

  render() {
    let { style, ...props } = this.props;

    return <NativeBlurView {...props} style={[style, { backgroundColor: 'transparent' }]} />;
  }
}

const NativeBlurView = requireNativeComponent('ExponentBlurView', BlurView);
