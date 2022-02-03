import React from 'react';
import { Image, ImageStyle } from 'react-native';

import Icons from '../constants/Icons';

type Props = {
  name: string;
  style?: ImageStyle;
};

const ExpoAPIIcon = ({ name, style }: Props) => {
  const icon = React.useMemo(() => (Icons[name] || Icons.Default)(), [name]);
  return <Image source={icon} style={[{ width: 24, height: 24 }, style]} />;
};

export default ExpoAPIIcon;
