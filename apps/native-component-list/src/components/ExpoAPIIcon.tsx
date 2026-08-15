import React from 'react';
import { Image, ImageStyle } from 'react-native';

import { useTheme } from '../../../common/ThemeProvider';
import Icons from '../constants/Icons';

type Props = {
  name: string;
  style?: ImageStyle;
};

const ExpoAPIIcon = ({ name, style }: Props) => {
  const { theme } = useTheme();
  const icon = React.useMemo(() => (Icons[name] || Icons.Default)(), [name]);
  return (
    <Image
      source={icon}
      style={[{ width: 24, height: 24, tintColor: theme.text.default }, style]}
    />
  );
};

export default ExpoAPIIcon;
