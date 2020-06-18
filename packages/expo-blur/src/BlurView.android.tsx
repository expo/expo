import * as React from 'react';
import { View } from 'react-native';

import { BlurProps } from './BlurView.types';
import getBackgroundColor from './getBackgroundColor';

class BlurView extends React.Component<BlurProps> {
  render() {
    const { tint = 'default', intensity = 100, style, ...props } = this.props;
    const backgroundColor = getBackgroundColor(intensity, tint);
    return <View {...props} style={[style, { backgroundColor }]} />;
  }
}

export default BlurView;
