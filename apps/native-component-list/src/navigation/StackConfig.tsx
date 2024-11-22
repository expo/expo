import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { HeaderStyleInterpolators } from '@react-navigation/stack';
import { ThemeType } from 'ThemeProvider';
import * as React from 'react';
import { View, Platform, TouchableOpacity, StyleSheet } from 'react-native';

export default function getStackConfig(navigation: BottomTabNavigationProp<any>, theme: ThemeType) {
  return {
    cardStyle: {
      backgroundColor: theme.background.default,
    },
    screenOptions: () => ({
      headerStyleInterpolator: HeaderStyleInterpolators.forUIKit,
      headerStyle: {
        backgroundColor: theme.background.default,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.secondary,
        ...Platform.select({
          android: {
            elevation: 0,
          },
        }),
      },
      headerTintColor: theme.icon.info,
      headerTitleStyle: {
        color: theme.text.default,
      },
      headerPressColorAndroid: theme.icon.info,
      headerRight: () => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginRight: 16,
            marginBottom: 4,
            gap: 14,
          }}>
          <TouchableOpacity onPress={() => navigation.navigate('searchNavigator')}>
            <Ionicons
              name="search"
              size={Platform.OS === 'ios' ? 22 : 25}
              color={theme.icon.info}
            />
          </TouchableOpacity>
          {/* This toggler does not work properly, it only updates the navigation and not the body UI */}
          {/* <ThemeToggler /> */}
        </View>
      ),
    }),
  };
}
