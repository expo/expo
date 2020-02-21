import React from 'react';
import { ApolloProvider } from 'react-apollo';
import { Provider as ReduxProvider } from 'react-redux';
import { AppearanceProvider, useColorScheme } from 'react-native-appearance';

import HomeApp from './HomeApp';
import ApolloClient from './api/ApolloClient';
import Store from './redux/Store';

import './menu/DevMenuApp';

export default (props: any) => {
  let colorScheme = useColorScheme();

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
