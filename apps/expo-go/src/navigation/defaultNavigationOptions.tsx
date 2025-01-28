import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { StackNavigationOptions, HeaderStyleInterpolators } from '@react-navigation/stack';
import { Platform, StyleSheet } from 'react-native';

import { ColorTheme } from '../constants/Colors';

export default (theme: ColorTheme): StackNavigationOptions => {
  return {
    headerStyle: {
      elevation: 0,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme === 'dark' ? darkTheme.border.default : lightTheme.border.default,
      backgroundColor:
        theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
    },
    headerTitleStyle: {
      fontWeight: Platform.OS === 'ios' ? '600' : '400',
      fontFamily: 'Inter-SemiBold',
      color: theme === 'dark' ? darkTheme.text.default : lightTheme.text.default,
    },
    headerTintColor: theme === 'dark' ? darkTheme.icon.default : lightTheme.icon.default,
    headerBackButtonDisplayMode: 'minimal',
    headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
  };
};
