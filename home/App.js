import './LegacyReact';

import React from 'react';
import { NativeModules } from 'react-native';
import { ApolloProvider } from 'react-apollo';
import { Provider as ReduxProvider } from 'react-redux';

import Store from './redux/Store';
import ApolloClient from './api/ApolloClient';
import HomeApp from './HomeApp';

let { JSCExecutor } = NativeModules;

export default class App extends React.Component {
  render() {
    return (
      <ReduxProvider store={Store}>
        <ApolloProvider client={ApolloClient}>
          <HomeApp {...this.props} />
        </ApolloProvider>
      </ReduxProvider>
    );
  }
}
if (JSCExecutor) {
  JSCExecutor.setContextName('Expo Home');
}
