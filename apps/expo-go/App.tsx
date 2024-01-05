import { ApolloProvider } from '@apollo/client';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import { Provider as ReduxProvider } from 'react-redux';

import HomeApp from './src/HomeApp';
import ApolloClient from './src/api/ApolloClient';
import Store from './src/redux/Store';
import './src/menu/DevMenuApp';
import { AccountNameProvider } from './src/utils/AccountNameContext';
import { InitialDataProvider } from './src/utils/InitialDataContext';

if (Platform.OS === 'android') {
  enableScreens(false);
}
SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={Store}>
        <ApolloProvider client={ApolloClient}>
          <InitialDataProvider>
            <AccountNameProvider>
              <HomeApp />
            </AccountNameProvider>
          </InitialDataProvider>
        </ApolloProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
