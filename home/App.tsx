import { ApolloProvider } from '@apollo/client';
import React from 'react';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';
import { Provider as ReduxProvider } from 'react-redux';

import ApolloClient from './api/ApolloClient';
import HomeApp from './HomeApp';
import Store from './redux/Store';

import './menu/DevMenuApp';

export default (props: any) => {
  const colorScheme = useColorScheme();

  return (
    <AppearanceProvider>
      <ReduxProvider store={Store}>
        <ApolloProvider client={ApolloClient}>
          <HomeApp {...props} colorScheme={colorScheme} />
        </ApolloProvider>
      </ReduxProvider>
    </AppearanceProvider>
  );
};
