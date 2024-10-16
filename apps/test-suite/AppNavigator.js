import MaterialCommunityIcons from '@expo/vector-icons/build/MaterialCommunityIcons';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';
import { StyleSheet, View } from 'react-native';

import SelectScreen from './screens/SelectScreen';
import RunTests from './screens/TestScreen';
import { useTheme } from '../common/ThemeProvider';
import ThemeToggler from '../common/ThemeToggler';

// @tsapeta: This navigator is also being used by `bare-expo` app,
// so make sure it still works there once you change something here.

const Stack = createStackNavigator();

const spec = {
  animation: 'timing',
  config: {
    duration: 0,
  },
};

// TODO: Disable transition animations in E2E tests
const shouldDisableTransition = false;

const transitionSpec = shouldDisableTransition ? { open: spec, close: spec } : undefined;

export default function AppNavigator(props) {
  const { theme } = useTheme();

  React.useLayoutEffect(() => {
    if (props.navigation) {
      props.navigation.setOptions({
        title: 'Tests',
        tabBarLabel: 'Tests',
        tabBarIcon: ({ focused }) => {
          const color = focused ? theme.icon.info : theme.icon.default;
          return <MaterialCommunityIcons name="format-list-checks" size={27} color={color} />;
        },
        tabBarBackground: () => <TabBackground />,
      });
    }
  }, [props.navigation]);

  return (
    <Stack.Navigator
      {...props}
      screenOptions={{
        title: 'Tests',
        transitionSpec,
        headerBackTitle: 'Select',
        headerTitleStyle: {
          color: theme.text.default,
        },
        headerTintColor: theme.icon.info,
        headerStyle: {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border.secondary,
          backgroundColor: theme.background.default,
          boxShadow: '',
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
                marginRight: 16,
                marginBottom: 4,
                gap: 12,
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

function TabBackground() {
  const { theme } = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.background.default }} />;
}
