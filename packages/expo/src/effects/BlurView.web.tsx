import PropTypes from 'prop-types';
import * as React from 'react';
import { View, StyleSheet, ViewPropTypes } from 'react-native';

type Props = {
  tint: BlurTint;
} & React.ComponentProps<typeof View>;
type BlurTint = 'light' | 'dark' | 'default';

export default class BlurView extends React.Component<Props> {
  static propTypes = {
    tint: PropTypes.oneOf(['light', 'default', 'dark']),
    ...ViewPropTypes,
  };

  render() {
    let { tint, style = {}, ...props } = this.props;

    let backgroundColor = 'rgba(255,255,255,0.4)';
    if (tint === 'dark') {
      backgroundColor = 'rgba(0,0,0,0.5)';
    } else if (tint === 'light') {
      backgroundColor = 'rgba(255,255,255,0.7)';
    }

    return <View {...props} style={StyleSheet.flatten([style, { backgroundColor }])} />;
  }
}
