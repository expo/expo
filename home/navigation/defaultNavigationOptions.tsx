import { darkTheme, lightTheme } from '@expo/styleguide-native';
import { StackNavigationOptions, HeaderStyleInterpolators } from '@react-navigation/stack';
import FeatureFlags from 'FeatureFlags';
import { Platform, StyleSheet } from 'react-native';

import Colors, { ColorTheme } from '../constants/Colors';

export default (theme: ColorTheme): StackNavigationOptions => {
  return {
    headerStyle: {
      borderBottomColor: Colors[theme].cardSeparator,
      elevation: 0,
      backgroundColor: Colors[theme].navBackgroundColor,
      borderBottomWidth: StyleSheet.hairlineWidth,
      ...(FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN && {
        borderBottomColor: theme === 'dark' ? darkTheme.border.default : lightTheme.border.default,
        backgroundColor:
          theme === 'dark' ? darkTheme.background.default : lightTheme.background.default,
      }),
    },
    headerTitleStyle: {
      fontWeight: Platform.OS === 'ios' ? '600' : '400',
      color: Colors[theme].text,
      ...(FeatureFlags.ENABLE_2022_NAVIGATION_REDESIGN && {
        fontFamily: 'Inter-SemiBold',
        color: theme === 'dark' ? darkTheme.text.default : lightTheme.text.default,
      }),
    },
    headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
  };
};
