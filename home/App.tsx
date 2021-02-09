import { ApolloProvider } from '@apollo/client';
import * as SplashScreen from 'expo-splash-screen';
import * as React from 'react';
import { AppearanceProvider } from 'react-native-appearance';
import { Provider as ReduxProvider } from 'react-redux';

import HomeApp from './HomeApp';
import ApolloClient from './api/ApolloClient';
import Store from './redux/Store';

import './menu/DevMenuApp';

SplashScreen.preventAutoHideAsync();

export default function App() {
  return (
    <AppearanceProvider>
      <ReduxProvider store={Store}>
        {/* @ts-expect-error apollo-boost (deprecated) tsdefs are incompatible */}
        <ApolloProvider client={ApolloClient}>
          <HomeApp />
        </ApolloProvider>
      </ReduxProvider>
    </AppearanceProvider>
  );
}
