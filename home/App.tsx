import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';
import { Provider as ReduxProvider } from 'react-redux';

import HomeApp from './HomeApp';
import ApolloClient from './api/ApolloClient';
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
