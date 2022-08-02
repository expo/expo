import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import React from 'react';
import { Platform } from 'react-native';

import useTheme from '../theme/useTheme';

type Props = {
  name: string;
  focused?: boolean;
  size?: number;
};

const TabIcon = ({ size = 27, name, focused }: Props) => {
  const { theme } = useTheme();
  const color = focused ? theme.link.default : theme.icon.secondary;
  const platformSize = Platform.select({
    ios: size,
    default: size - 2,
  });
  return <MaterialCommunityIcons name={name as any} size={platformSize} color={color} />;
};

export default TabIcon;
