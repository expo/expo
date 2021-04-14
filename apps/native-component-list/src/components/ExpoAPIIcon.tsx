import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';

import Icons from '../constants/Icons';

export default function ExpoAPIIcon({
  name,
  style,
}: {
  name: string;
  style?: StyleProp<ImageStyle>;
}) {
  const icon = React.useMemo(() => (Icons[name] || Icons.Default)(), [name]);
  return <Image source={icon} style={[{ width: 24, height: 24 }, style]} />;
}
