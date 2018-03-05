import 'LegacyReact';

import Expo from 'expo';
import React from 'react';
import { AppRegistry, DeviceEventEmitter, NativeModules } from 'react-native';
import { ApolloProvider } from 'react-apollo';

import Store from './redux/Store';
import ApolloClient from './api/ApolloClient';
import HomeApp from './HomeApp';

class WrapWithStore extends React.Component {
  render() {
    return (
      <ApolloProvider client={ApolloClient} store={Store}>
        {this.props.children}
      </ApolloProvider>
    );
  }
}

export default class App extends React.Component {
  render() {
    return (
      <WrapWithStore>
        <HomeApp {...this.props} />
      </WrapWithStore>
    );
  }
}
