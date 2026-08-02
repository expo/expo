import Ionicons from '@expo/vector-icons/Ionicons';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigatorProps } from '@react-navigation/native-stack';
import { ThemeType } from 'ThemeProvider';
import * as React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';

export default function getStackConfig(
  navigation: BottomTabNavigationProp<any>,
  theme: ThemeType
): Partial<NativeStackNavigatorProps> {
  return {
    screenOptions: {
      contentStyle: { backgroundColor: theme.background.default },
      headerStyle: { backgroundColor: theme.background.default },
      headerTintColor: theme.icon.info,
      headerTitleStyle: { color: theme.text.default },
      headerRight: () => <HeaderRightComponent navigation={navigation} theme={theme} />,
    },
  };
}

const HeaderRightComponent = ({
  navigation,
  theme,
}: {
  navigation: BottomTabNavigationProp<any>;
  theme: ThemeType;
}) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        marginBottom: 4,
        marginTop: 4,
        gap: 20,
      }}>
      <TouchableOpacity onPress={() => navigation.navigate('searchNavigator')}>
        <Ionicons name="search" size={Platform.OS === 'ios' ? 22 : 25} color={theme.icon.info} />
      </TouchableOpacity>
      {/* This toggler does not work properly, it only updates the navigation and not the body UI */}
      {/* <ThemeToggler /> */}
    </View>
  );
};
