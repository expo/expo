import {
  Ionicons as DefaultIonicons,
  MaterialIcons as DefaultMaterialIcons,
} from '@expo/vector-icons';
import * as React from 'react';
import { useTheme } from 'react-navigation';

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

  return <DefaultIonicons color={theme === 'dark' ? darkColor : lightColor} {...props} />;
};

export const MaterialIcons = (props: Props) => {
  const theme = useTheme();
  const darkColor = props.darkColor || '#fff';
  const lightColor = props.lightColor || '#ccc';

  return <DefaultMaterialIcons color={theme === 'dark' ? darkColor : lightColor} {...props} />;
};
