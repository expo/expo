import DefaultIonicons from '@expo/vector-icons/build/Ionicons';
import DefaultMaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';

type Props = {
  name: string;
  size?: number;
  style?: any;
  lightColor?: string;
  darkColor?: string;
};

export const Ionicons = (props: Props) => {
  const theme = useTheme();
  const darkColor = props.darkColor || '#fff';
  const lightColor = props.lightColor || '#ccc';

  return <DefaultIonicons color={theme.dark ? darkColor : lightColor} {...props} />;
};

export const MaterialIcons = (props: Props) => {
  const theme = useTheme();
  const darkColor = props.darkColor || '#fff';
  const lightColor = props.lightColor || '#ccc';

  return <DefaultMaterialIcons color={theme.dark ? darkColor : lightColor} {...props} />;
};
