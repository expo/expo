import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';

import { BlurTint, Props } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<Props> {
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
    let { tint, intensity, ...props } = this.props;

    let backgroundColor = getBackgroundColor(intensity, tint);

    return <View {...props} style={[this.props.style, { backgroundColor }]} />;
  }
}
