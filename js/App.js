import 'LegacyReact';

import Expo from 'expo';
import React from 'react';
import { AppRegistry, DeviceEventEmitter, NativeModules, Platform } from 'react-native';
import { ApolloProvider } from 'react-apollo';

import Store from './redux/Store';
import ApolloClient from './api/ApolloClient';
import ConsoleActions from './redux/ConsoleActions';
import ErrorScreenApp from './android/ErrorScreenApp';
import InfoScreenApp from './android/InfoScreenApp';
import HomeApp from './HomeApp';

let { JSCExecutor } = NativeModules;

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

class ErrorScreenAppWithStore extends React.Component {
  render() {
    return (
      <WrapWithStore>
        <ErrorScreenApp {...this.props} />
      </WrapWithStore>
    );
  }
}

if (Platform.OS === 'android') {
  DeviceEventEmitter.addListener('ExponentKernel.addError', event => {
    let { errorMessage, stack, exceptionId, isFatal } = event;

    errorMessage = errorMessage || 'Unknown error occurred';
    stack = stack || [];
    let action = ConsoleActions.logUncaughtError(exceptionId, errorMessage, stack, isFatal);
    Store.dispatch(action);
  });

  DeviceEventEmitter.addListener('ExponentKernel.clearConsole', event => {
    Store.dispatch(ConsoleActions.clearConsole());
  });
}

AppRegistry.registerComponent('ErrorScreenApp', () => ErrorScreenAppWithStore);
AppRegistry.registerComponent('InfoScreenApp', () => InfoScreenApp);
if (JSCExecutor) {
  JSCExecutor.setContextName('Exponent');
}
