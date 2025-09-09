import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { View } from 'react-native';

import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';
import { useTheme } from '../common/ThemeProvider';
import ThemeToggler from '../common/ThemeToggler';

// @tsapeta: This navigator is also being used by `bare-expo` app,
// so make sure it still works there once you change something here.

const Stack = createNativeStackNavigator();

export function TestStackNavigator() {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      id={undefined}
      screenOptions={{
        title: 'Tests',
        headerBackTitle: 'Select',
        headerTitleStyle: {
          color: theme.text.default,
        },
        headerTintColor: theme.icon.info,
        headerStyle: {
          backgroundColor: theme.background.default,
        },
      }}>
      <Stack.Screen
        name="select"
        component={SelectScreen}
        options={{
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
        }}
      />
      <Stack.Screen name="run" component={RunTests} options={{ title: 'Test Runner' }} />
    </Stack.Navigator>
  );
}

TestStackNavigator.navigationOptions = {
  title: 'Tests',
  tabBarLabel: 'Tests',
  tabBarIcon: TabBarIcon,
  tabBarBackground: () => <TabBackground />,
};

function TabBarIcon({ focused }) {
  const { theme } = useTheme();
  const color = focused ? theme.icon.info : theme.icon.default;
  return <MaterialCommunityIcons name="format-list-checks" size={27} color={color} />;
}

function TabBackground() {
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background.default }} />;
}
