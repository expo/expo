import * as React from 'react';
import { useTheme } from 'react-navigation';
import {
  Ionicons as DefaultIonicons,
  MaterialIcons as DefaultMaterialIcons,
} from '@expo/vector-icons';

type Props = {
  name: string;
  size?: number;
  style?: any;
  lightColor?: string;
  darkColor?: string;
};

export const Ionicons = (props: Props) => {
  let theme = useTheme();
  let darkColor = props.darkColor || '#fff';
  let lightColor = props.lightColor || '#ccc';

  return <DefaultIonicons color={theme === 'dark' ? darkColor : lightColor} {...props} />;
};

export const MaterialIcons = (props: Props) => {
  let theme = useTheme();
  let darkColor = props.darkColor || '#fff';
  let lightColor = props.lightColor || '#ccc';

  return <DefaultMaterialIcons color={theme === 'dark' ? darkColor : lightColor} {...props} />;
};
