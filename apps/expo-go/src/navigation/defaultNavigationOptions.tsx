import { darkTheme, lightTheme } from '@expo/styleguide-native';
import {
  StackNavigationOptions,
  HeaderStyleInterpolators,
  Header,
  StackHeaderProps,
} from '@react-navigation/stack';
import { Platform, StyleSheet, ViewStyle } from 'react-native';

import { CappedWidthContainerView } from '../components/Views';
import { ColorTheme } from '../constants/Colors';

export default (theme: ColorTheme): StackNavigationOptions => {
  const androidHeader = (props: StackHeaderProps) => (
    <CappedWidthContainerView
      wrapperStyle={[
        props.options.headerStyle as ViewStyle,
        {
          flex: 0,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor:
            theme === 'dark' ? darkTheme.border.default : lightTheme.border.default,
        },
      ]}
      style={{ flex: 0 }}>
      <Header {...props} />
    </CappedWidthContainerView>
  );

  return {
    // On iOS the header title is centered by default so we can skip adding padding to it
    header: Platform.OS === 'android' ? androidHeader : undefined,
    headerStyle: {
      elevation: 0,
      // On android the border is added in the `androidHeader` component above
      borderBottomWidth: Platform.OS === 'android' ? 0 : StyleSheet.hairlineWidth,
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
