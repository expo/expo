import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';

import { BlurTint, BlurProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<BlurProps> {
  static propTypes = {
    ...ViewPropTypes,
    tint: PropTypes.oneOf(['light', 'default', 'dark'] as BlurTint[]).isRequired,
    intensity: PropTypes.number.isRequired,
  };

  static defaultProps = {
    tint: 'default' as BlurTint,
    intensity: 100,
  };

  render() {
    const { tint, intensity, ...props } = this.props;

    const backgroundColor = getBackgroundColor(intensity, tint);

    return <View {...props} style={[this.props.style, { backgroundColor }]} />;
  }
}
