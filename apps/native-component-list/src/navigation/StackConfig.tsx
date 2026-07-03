import Ionicons from '@expo/vector-icons/Ionicons';
import { ThemeType } from 'ThemeProvider';
import { type NativeStackNavigationOptions, useRouter } from 'expo-router';
import * as React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';

export function getStackScreenOptions(theme: ThemeType): NativeStackNavigationOptions {
  return {
    contentStyle: { backgroundColor: theme.background.default },
    headerStyle: { backgroundColor: theme.background.default },
    headerTintColor: theme.icon.info,
    headerTitleStyle: { color: theme.text.default },
    headerRight: () => <HeaderRightComponent theme={theme} />,
  };
}

const HeaderRightComponent = ({ theme }: { theme: ThemeType }) => {
  const router = useRouter();
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
      <TouchableOpacity onPress={() => router.push('/search')}>
        <Ionicons name="search" size={Platform.OS === 'ios' ? 22 : 25} color={theme.icon.info} />
      </TouchableOpacity>
      {/* This toggler does not work properly, it only updates the navigation and not the body UI */}
      {/* <ThemeToggler /> */}
    </View>
  );
};
