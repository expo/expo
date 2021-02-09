import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

import Icons from '../constants/Icons';

export default class ExpoAPIIcon extends React.Component<{
  name: string;
  style?: StyleProp<ImageStyle>;
}> {
  render() {
    const { name, style } = this.props;
    let iconKey = 'Default';
    if (name && Icons.hasOwnProperty(name)) {
      iconKey = name;
    }
    return <Image source={Icons[iconKey]} style={[{ width: 24, height: 24 }, style]} />;
  }
}
