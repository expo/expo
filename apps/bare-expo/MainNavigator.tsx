import AsyncStorage from '@react-native-async-storage/async-storage';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as Linking from 'expo-linking';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { TestStackNavigator } from 'test-suite/TestStackNavigator';

type NavigationRouteConfigMap = React.ComponentType;

const testSuiteRouteName = 'test-suite';

type RoutesConfig = {
  [testSuiteRouteName]: NavigationRouteConfigMap;
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
  [testSuiteRouteName]: TestStackNavigator,
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

// TODO skip apis in CI?
const nclLinking: Record<string, any> = {};
if (NativeComponentList) {
  routes.apis = NativeComponentList.apis.navigator;
  routes.components = NativeComponentList.components.navigator;
  nclLinking.apis = NativeComponentList.apis.linking;
  nclLinking.components = NativeComponentList.components.linking;
}

const Tab = createBottomTabNavigator();
const Switch = createNativeStackNavigator();

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
        initialRouteName: testSuiteRouteName,
        screens: {
          [testSuiteRouteName]: {
            path: testSuiteRouteName,
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
        default: undefined,
      })}
      initialRouteName={testSuiteRouteName}>
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

export default function MainNavigator() {
  const { name: themeName } = useTheme();
  const [isReady, setIsReady] = React.useState(Platform.OS === 'web');
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    if (isReady) {
      return;
    }
    const restoreState = async () => {
      const key = 'PERSIST_NAV_STATE';
      const persistenceEnabled = !!(await AsyncStorage.getItem(key));

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
      <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
    </NavigationContainer>
  );
}
