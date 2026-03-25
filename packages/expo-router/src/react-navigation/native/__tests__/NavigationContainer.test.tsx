import { expect, jest, test } from '@jest/globals';
import {
  createNavigationContainerRef,
  createNavigatorFactory,
  type ParamListBase,
  StackRouter,
  TabRouter,
  useNavigationBuilder,
} from '../../core';
import { act, render, waitFor } from '@testing-library/react-native';

import { window } from '../__stubs__/window';
import { NavigationContainer } from '../NavigationContainer';

Object.assign(global, window);

// We want to use the web version of useLinking
// eslint-disable-next-line import-x/extensions
jest.mock('../useLinking', () => require('../useLinking.tsx'));

test('integrates with the history API', async () => {
  const createStackNavigator = createNavigatorFactory((props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      StackRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route, i) => (
          <div key={route.key} aria-current={state.index === i || undefined}>
            {descriptors[route.key].render()}
          </div>
        ))}
      </NavigationContent>
    );
  });

  const createTabNavigator = createNavigatorFactory((props: any) => {
    const { state, descriptors, NavigationContent } = useNavigationBuilder(
      TabRouter,
      props
    );

    return (
      <NavigationContent>
        {state.routes.map((route, i) => (
          <div key={route.key} aria-current={state.index === i || undefined}>
            {descriptors[route.key].render()}
          </div>
        ))}
      </NavigationContent>
    );
  });

  const Stack = createStackNavigator();
  const Tab = createTabNavigator();

  const TestScreen = ({ route }: any): any =>
    `${route.name} ${JSON.stringify(route.params)}`;

  const linking = {
    prefixes: [],
    config: {
      screens: {
        Home: {
          path: '',
          initialRouteName: 'Feed',
          screens: {
            Profile: ':user',
            Settings: 'edit',
            Updates: 'updates',
            Feed: 'feed',
          },
        },
        Chat: 'chat',
      },
    },
  };

  const navigation = createNavigationContainerRef<ParamListBase>();

  render(
    <NavigationContainer ref={navigation} linking={linking}>
      <Tab.Navigator>
        <Tab.Screen name="Home">
          {() => (
            <Stack.Navigator initialRouteName="Feed">
              <Stack.Screen name="Profile" component={TestScreen} />
              <Stack.Screen name="Settings" component={TestScreen} />
              <Stack.Screen name="Feed" component={TestScreen} />
              <Stack.Screen name="Updates" component={TestScreen} />
            </Stack.Navigator>
          )}
        </Tab.Screen>
        <Tab.Screen name="Chat" component={TestScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );

  expect(window.location.pathname).toBe('/feed');

  act(() => navigation.current?.navigate('Profile', { user: 'jane' }));

  await waitFor(() => expect(window.location.pathname).toBe('/jane'));

  act(() => navigation.current?.navigate('Updates'));

  await waitFor(() => expect(window.location.pathname).toBe('/updates'));

  act(() => navigation.current?.goBack());

  await waitFor(() => expect(window.location.pathname).toBe('/jane'));

  act(() => {
    window.history.back();
  });

  await waitFor(() => expect(window.location.pathname).toBe('/feed'));

  act(() => {
    window.history.forward();
  });

  await waitFor(() => expect(window.location.pathname).toBe('/jane'));

  act(() => navigation.current?.navigate('Settings'));

  await waitFor(() => expect(window.location.pathname).toBe('/edit'));

  act(() => {
    window.history.go(-2);
  });

  await waitFor(() => expect(window.location.pathname).toBe('/feed'));

  act(() => navigation.current?.navigate('Settings'));
  act(() => navigation.current?.navigate('Chat'));

  await waitFor(() => expect(window.location.pathname).toBe('/chat'));

  act(() => navigation.current?.navigate('Home'));

  await waitFor(() => expect(window.location.pathname).toBe('/edit'));
});
