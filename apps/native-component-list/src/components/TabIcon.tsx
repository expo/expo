import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from 'ThemeProvider';
import React from 'react';
import { Platform } from 'react-native';

type Props = {
  name: string;
  focused?: boolean;
  size?: number;
};

const TabIcon = ({ size = 27, name, focused }: Props) => {
  const { theme } = useTheme();
  const color = focused ? theme.icon.info : theme.icon.default;
  const platformSize = Platform.select({
    ios: size,
    default: size - 2,
  });
  return <MaterialCommunityIcons name={name as any} size={platformSize} color={color} />;
};

export default TabIcon;
