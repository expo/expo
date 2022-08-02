import { SearchIcon, ThemeIcon } from '@expo/styleguide-native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HeaderStyleInterpolators } from '@react-navigation/stack';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';

import useTheme from '../theme/useTheme';

type BaseStackNavigatorProps = React.PropsWithChildren<{
  navigation: BottomTabNavigationProp<any>;
  Stack: any;
}>;

export const BaseStackNavigator = (props: BaseStackNavigatorProps) => {
  const { theme, toggleTheme } = useTheme();
  const { Stack, navigation, children, ...rest } = props;

  const stackConfig = {
    cardStyle: {
      backgroundColor: theme.background.default,
    },
    screenOptions: () => ({
      headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
      headerStyle: {
        backgroundColor: theme.background.default,
        shadowColor: 'transparent',
        elevation: 0,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.default,
      },
      headerTintColor: theme.link.default,
      headerTitleStyle: {
        color: theme.text.default,
      },
      headerPressColorAndroid: theme.link.default,
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => toggleTheme()}>
            <ThemeIcon size={Platform.OS === 'ios' ? 18 : 21} color={theme.link.default} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('search')}
            style={{ marginHorizontal: 16 }}>
            <SearchIcon size={Platform.OS === 'ios' ? 18 : 21} color={theme.link.default} />
          </TouchableOpacity>
        </View>
      ),
    }),
  };

  return (
    <Stack.Navigator {...rest} {...stackConfig}>
      {children}
    </Stack.Navigator>
  );
};
