import { DarkTheme, DefaultTheme } from '@react-navigation/native';

import Colors, { ColorTheme } from './Colors';

export default {
  [ColorTheme.LIGHT]: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      text: Colors.light.text,
      card: Colors.light.tabBar,
      border: Colors.light.navBorderBottom,
      primary: Colors.light.tintColor,
    },
  },
  [ColorTheme.DARK]: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      text: Colors.dark.text,
      card: Colors.dark.tabBar,
      border: Colors.dark.navBorderBottom,
      primary: Colors.dark.tintColor,
    },
  },
};
