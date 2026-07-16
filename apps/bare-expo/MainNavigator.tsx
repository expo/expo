import {
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'ThemeProvider';
import * as Linking from 'expo-linking';
import { AppMetrics } from 'expo-observe';
import { ObserveNavigationContainer } from 'expo-observe/integrations/react-navigation';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TestStackNavigator } from 'test-suite/TestStackNavigator';

import Playground from './Playground';

type NavigationRouteConfigMap = React.ComponentType & {
  navigationOptions?: BottomTabNavigationOptions;
};

const testSuiteRouteName = 'test-suite';

type RoutesConfig = {
  [testSuiteRouteName]: NavigationRouteConfigMap;
  apis?: NavigationRouteConfigMap;
  components?: NavigationRouteConfigMap;
  playground: NavigationRouteConfigMap;
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
  playground: Playground,
};

// TODO vonovak there's potential for skipping the require of APIs tab as it's not used in CI
// could use metro config to exclude it from bundling
const NativeComponentList: NativeComponentListExportsType = optionalRequire(() =>
  require('native-component-list/src/navigation/MainNavigators')
) as any;
const Redirect = optionalRequire(() =>
  require('native-component-list/src/screens/RedirectScreen')
) as any;
const SearchScreenModule = (() => {
  try {
    return require('native-component-list/src/screens/SearchScreen');
  } catch {
    return null;
  }
})();
const Search = (SearchScreenModule?.default ?? null) as any;
const getSearchScreenOptions = SearchScreenModule?.getSearchScreenOptions ?? null;

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
      {Object.entries(routes).map(([name, component]) =>
        component ? (
          <Tab.Screen
            name={name}
            key={name}
            component={component}
            options={component.navigationOptions}
          />
        ) : null
      )}
    </Tab.Navigator>
  );
}
export default function MainNavigator() {
  const { name: themeName, theme } = useTheme();

  React.useEffect(() => {
    AppMetrics.markInteractive({
      params: {
        theme: themeName,
      },
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ObserveNavigationContainer linking={linking}>
        <Switch.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName="main"
          id={undefined}>
          {Redirect && <Switch.Screen name="redirect" component={Redirect} />}
          {Search && (
            <Switch.Screen
              name="searchNavigator"
              component={Search}
              options={getSearchScreenOptions?.(theme)}
            />
          )}
          <Switch.Screen name="main" component={TabNavigator} />
        </Switch.Navigator>
        <StatusBar style={themeName === 'light' ? 'dark' : 'light'} />
      </ObserveNavigationContainer>
    </GestureHandlerRootView>
  );
}
