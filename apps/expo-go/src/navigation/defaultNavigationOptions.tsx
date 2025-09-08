import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Platform } from 'react-native';

import { ColorTheme } from '../constants/Colors';

export default (theme: ColorTheme): NativeStackNavigationOptions => {
  return {
    headerStyle: {
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
  };
};
