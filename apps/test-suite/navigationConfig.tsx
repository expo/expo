import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { type NativeStackNavigationOptions } from 'expo-router';
import * as React from 'react';
import { View } from 'react-native';

import { ThemeType, useTheme } from '../common/ThemeProvider';
import ThemeToggler from '../common/ThemeToggler';

// @tsapeta: This config is also being used by the `bare-expo` app,
// so make sure it still works there once you change something here.

export function getTestSuiteStackScreenOptions(theme: ThemeType): NativeStackNavigationOptions {
  return {
    title: 'Tests',
    headerBackTitle: 'Select',
    headerTitleStyle: {
      color: theme.text.default,
    },
    headerTintColor: theme.icon.info,
    headerStyle: {
      backgroundColor: theme.background.default,
    },
  };
}

export function getSelectScreenOptions(): NativeStackNavigationOptions {
  return {
    title: 'Expo Test Suite',
    headerRight: () => (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginHorizontal: 10,
        }}>
        <ThemeToggler />
      </View>
    ),
  };
}

export function TestSuiteTabIcon({ focused }: { focused: boolean }) {
  const { theme } = useTheme();
  const color = focused ? theme.icon.info : theme.icon.default;
  return <MaterialCommunityIcons name="format-list-checks" size={27} color={color} />;
}
