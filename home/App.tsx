import { ApolloProvider } from '@apollo/client';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform } from 'react-native';
import { AppearanceProvider } from 'react-native-appearance';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { Provider as ReduxProvider } from 'react-redux';

import HomeApp from './HomeApp';
import ApolloClient from './api/ApolloClient';
import Store from './redux/Store';

import './menu/DevMenuApp';

if (Platform.OS === 'android') {
  enableScreens(false);
}
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppearanceProvider>
        <ReduxProvider store={Store}>
          <ApolloProvider client={ApolloClient}>
            <HomeApp />
          </ApolloProvider>
        </ReduxProvider>
      </AppearanceProvider>
    </GestureHandlerRootView>
  );
}
