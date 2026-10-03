import Ionicons from '@react-native-vector-icons/ionicons';
import { ThemeType, useTheme } from 'ThemeProvider';
import { Stack, router, type NativeStackNavigationOptions, useRouter } from 'expo-router';
import * as React from 'react';
import { View, Platform, TouchableOpacity } from 'react-native';

// iOS takes an SF Symbol name, Android needs an xml drawable.
const searchIcon =
  process.env.EXPO_OS === 'ios' ? 'magnifyingglass' : require('@expo/material-symbols/search.xml');

export function getStackScreenOptions(theme: ThemeType): NativeStackNavigationOptions {
  return {
    contentStyle: { backgroundColor: theme.background.default },
    headerStyle: { backgroundColor: theme.background.default },
    headerTintColor: theme.icon.info,
    headerTitleStyle: { color: theme.text.default },
  };
}

/** Header search button, rendered by the screens that browse the API and component lists. */
export function SearchToolbar() {
  const { theme } = useTheme();

  // Toolbar items have no native counterpart on web, so `asChild` renders a JS button instead.
  if (Platform.OS === 'web') {
    return (
      <Stack.Toolbar placement="right" asChild>
        <HeaderRightComponent theme={theme} />
      </Stack.Toolbar>
    );
  }

  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        accessibilityLabel="Search"
        icon={searchIcon}
        tintColor={theme.icon.info}
        onPress={() => router.push('/search')}
      />
    </Stack.Toolbar>
  );
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
