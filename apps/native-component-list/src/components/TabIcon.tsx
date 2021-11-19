import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import React from 'react';
import { Platform } from 'react-native';

import { Colors } from '../constants';

type Props = {
  name: string;
  focused?: boolean;
  size?: number;
};

const TabIcon = ({ size = 27, name, focused }: Props) => {
  const color = focused ? Colors.tabIconSelected : Colors.tabIconDefault;
  const platformSize = Platform.select({
    ios: size,
    default: size - 2,
  });
  return <MaterialCommunityIcons name={name as any} size={platformSize} color={color} />;
};

export default TabIcon;
