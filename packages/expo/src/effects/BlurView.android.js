// @flow

import PropTypes from 'prop-types';
import * as React from 'react';
import { View, ViewPropTypes } from 'react-native';

type Props = {
  tint: 'light' | 'dark' | 'default',
} & React.ElementProps<typeof View>;

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']),
    ...ViewPropTypes,
  };

  render() {
    let { tint, ...props } = this.props;

    let backgroundColor;
    if (tint === 'dark') {
      backgroundColor = 'rgba(0,0,0,0.5)';
    } else if (tint === 'light') {
      backgroundColor = 'rgba(255,255,255,0.7)';
    } else {
      backgroundColor = 'rgba(255,255,255,0.4)';
    }

    return <View {...props} style={[this.props.style, { backgroundColor }]} />;
  }
}
