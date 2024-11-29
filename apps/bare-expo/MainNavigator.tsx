import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'ThemeProvider';
import * as Linking from 'expo-linking';
import React from 'react';
import { ToastAndroid, Platform } from 'react-native';
import TestSuite from 'test-suite/AppNavigator';

type NavigationRouteConfigMap = React.ReactElement;

type RoutesConfig = {
  'test-suite': NavigationRouteConfigMap;
  apis?: NavigationRouteConfigMap;
  components?: NavigationRouteConfigMap;
};

type NativeComponentListExportsType = null | {
  [routeName: string]: {
    linking: any;
    navigator: NavigationRouteConfigMap;
  };
};

export function optionalRequire(requirer: () => { default: React.ComponentType }) {
  try {
    return requirer().default;
  } catch {
    return null;
  }
}

const routes: RoutesConfig = {
  'test-suite': TestSuite,
};

// We'd like to get rid of `native-component-list` being a part of the final bundle.
// Otherwise, some tests may fail due to timeouts (bundling takes significantly more time).
// See `babel.config.js` and `moduleResolvers/nullResolver.js` for more details.
const NativeComponentList: NativeComponentListExportsType = optionalRequire(() =>
  require('native-component-list/src/navigation/MainNavigators')
) as any;
const Redirect = optionalRequire(() =>
  require('native-component-list/src/screens/RedirectScreen')
) as any;
const Search = optionalRequire(() =>
  require('native-component-list/src/screens/SearchScreen')
) as any;

const DevMenu = optionalRequire(() => require('expo-dev-menu')) as any;

const nclLinking: Record<string, any> = {};
if (NativeComponentList) {
  routes.apis = NativeComponentList.apis.navigator;
  routes.components = NativeComponentList.components.navigator;
  nclLinking.apis = NativeComponentList.apis.linking;
  nclLinking.components = NativeComponentList.components.linking;
}

const Tab = createBottomTabNavigator();
const Switch = createStackNavigator();

const linking: LinkingOptions<object> = {
  prefixes: [
    Platform.select({
      web: Linking.createURL('/', { scheme: 'bareexpo' }),
      default: 'bareexpo://',
    }),
  ],
  config: {
    screens: {
      main: {
        initialRouteName: 'test-suite',
        screens: {
          'test-suite': {
            path: 'test-suite',
            screens: {
              select: '',
              run: '/run',
            },
          },

          ...nclLinking,
        },
      },
    },
  },
};

function TabNavigator() {
  const { theme } = useTheme();
  return (
    <Tab.Navigator
      id={undefined}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.text.info,
        tabBarInactiveTintColor: theme.text.default,
        tabBarStyle: {
          backgroundColor: theme.background.default,
          borderTopColor: theme.border.default,
        },
      }}
      safeAreaInsets={Platform.select({
        android: {
          bottom: 5,
        },
        default: undefined,
      })}
      initialRouteName="test-suite">
      {Object.keys(routes).map((name) => (
        <Tab.Screen
          name={name}
          key={name}
          component={routes[name]}
          options={routes[name].navigationOptions}
        />
      ))}
    </Tab.Navigator>
  );
}
const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

export default () => {
  const [isReady, setIsReady] = React.useState(Platform.OS === 'web');
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    if (isReady) {
      return;
    }
    const setupDevMenuItems = async () => {
      const key = 'PERSIST_NAV_STATE';
      const persistenceEnabled = !!(await AsyncStorage.getItem(key));

      // on Android, we need to keep the title of the item the same
      // because updating dev menu items currently doesn't work
      // TODO https://linear.app/expo/issue/ENG-12786
      const label = Platform.select({
        ios: persistenceEnabled
          ? '✗  Disable navigation state persistence'
          : '✓  Enable navigation state persistence',
        default: 'Toggle navigation state persistence',
      });
      const devMenuItems = [
        {
          shouldCollapse: true,
          name: label,
          callback: async () => {
            if (Platform.OS === 'android') {
              // because the label is always the same, we show a toast to inform
              // whether the persistence is going to be enabled or disabled
              const message = persistenceEnabled
                ? 'Navigation state persistence disabled'
                : 'Navigation state persistence enabled';
              ToastAndroid.show(message, ToastAndroid.LONG);
            }
            try {
              if (persistenceEnabled) {
                await AsyncStorage.removeItem(key);
              } else {
                await AsyncStorage.setItem(key, 'true');
              }
              // refresh the dev menu labels with latest preference
              await setupDevMenuItems();
            } catch (err) {
              console.error(err);
            }
          },
        },
      ];

      if (DevMenu) {
        await DevMenu.registerDevMenuItems(devMenuItems);
      }
      return persistenceEnabled;
    };
    const restoreState = async () => {
      const persistenceEnabled = await setupDevMenuItems();

      if (persistenceEnabled) {
        const initialUrl = await Linking.getInitialURL();

        if (initialUrl == null) {
          // Only restore state if there's no deep link
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString ? JSON.parse(savedStateString) : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      }
    };
    restoreState()
      .catch(console.error)
      .finally(() => setIsReady(true));
  }, [isReady]);

  if (!isReady) {
    return null;
  }
  return (
    <NavigationContainer
      linking={linking}
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)).catch(console.error);
      }}>
      <Switch.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName="main"
        id={undefined}>
        {Redirect && <Switch.Screen name="redirect" component={Redirect} />}
        {Search && <Switch.Screen name="searchNavigator" component={Search} />}
        <Switch.Screen name="main" component={TabNavigator} />
      </Switch.Navigator>
    </NavigationContainer>
  );
};
