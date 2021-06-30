import * as React from 'react';
import { View } from 'react-native';

import { BlurProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

export default class BlurView extends React.Component<BlurProps> {
  render() {
    const { tint, intensity, style, ...props } = this.props;
    const backgroundColor = getBackgroundColor(intensity, tint);
    return <View {...props} style={[style, { backgroundColor }]} />;
  }
}
