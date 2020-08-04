import { ApolloProvider } from '@apollo/client';
import * as React from 'react';
import { AppearanceProvider } from 'react-native-appearance';
import { Provider as ReduxProvider } from 'react-redux';

import HomeApp from './HomeApp';
import ApolloClient from './api/ApolloClient';
import Store from './redux/Store';

import './menu/DevMenuApp';

export default function App() {
  return (
    <AppearanceProvider>
      <ReduxProvider store={Store}>
        <ApolloProvider client={ApolloClient}>
          <HomeApp />
        </ApolloProvider>
      </ReduxProvider>
    </AppearanceProvider>
  );
}
