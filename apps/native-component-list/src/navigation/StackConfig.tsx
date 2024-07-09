import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HeaderStyleInterpolators } from '@react-navigation/stack';
import { ThemeType } from 'ThemeProvider';
import * as React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';

import { ThemeToggle } from '../../../common/ThemeToggler';

export default function getStackConfig(navigation: BottomTabNavigationProp<any>, theme: ThemeType) {
  return {
    cardStyle: {
      backgroundColor: theme.background.default,
    },
    screenOptions: () => ({
      headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
      headerStyle: Platform.select({
        default: {
          backgroundColor: theme.background.default,
          borderBottomColor: theme.border.secondary,
        },
        android: {
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.border.secondary,
        },
      }),
      headerTintColor: theme.icon.info,
      headerTitleStyle: {
        color: theme.text.default,
      },
      headerPressColorAndroid: theme.icon.info,
      headerRight: () => (
        <View
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
            marginBottom: 4,
            gap: 12,
          }}>
          <TouchableOpacity onPress={() => navigation.navigate('searchNavigator')}>
            <Ionicons
              name="search"
              size={Platform.OS === 'ios' ? 22 : 25}
              color={theme.icon.info}
            />
          </TouchableOpacity>
          <ThemeToggle />
        </View>
      ),
    }),
  };
}
