import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import Colors from './Colors';

export const light = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    text: Colors.light.text,
    card: Colors.light.tabBar,
    border: Colors.light.navBorderBottom,
    primary: Colors.light.tintColor,
  },
};
export const dark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    text: Colors.dark.text,
    card: Colors.dark.tabBar,
    border: Colors.dark.navBorderBottom,
    primary: Colors.dark.tintColor,
  },
};
