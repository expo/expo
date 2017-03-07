/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * The entry point for Exponent
 */
'use strict';

import Expo from 'expo';
import React from 'react';
import {
  AppRegistry,
  DeviceEventEmitter,
  NativeModules,
} from 'react-native';
import { ApolloProvider } from 'react-apollo';

// This has to be first.
import ExStore from 'ExStore';

import ApolloClient from './Api/ApolloClient';
import ConsoleActions from 'ConsoleActions';
import ErrorScreenApp from 'ErrorScreenApp';
import ExperienceNuxApp from 'ExperienceNuxApp';
import ExponentApp from 'ExponentApp';
import InfoScreenApp from 'InfoScreenApp';

import 'Kernel';

let { JSCExecutor } = NativeModules;

class WrapWithStore extends React.Component {
  render() {
    return (
      <ApolloProvider client={ApolloClient} store={ExStore}>
        {this.props.children}
      </ApolloProvider>
    );
  }
}

class App extends React.Component {
  render() {
    return (
      <WrapWithStore>
        <ExponentApp {...this.props} />
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

class ExperienceNuxAppWithStore extends React.Component {
  render() {
    return (
      <WrapWithStore>
        <ExperienceNuxApp {...this.props} />
      </WrapWithStore>
    );
  }
}

DeviceEventEmitter.addListener('ExponentKernel.addError', async (event) => {
  let { errorMessage, stack, exceptionId, isFatal } = event;

  errorMessage = errorMessage || 'Unknown error occurred';
  stack = stack || [];
  let action = ConsoleActions.logUncaughtError(exceptionId, errorMessage, stack, isFatal);
  ExStore.dispatch(action);
});

Expo.registerRootComponent(App);
AppRegistry.registerComponent('ErrorScreenApp', () => ErrorScreenAppWithStore);
AppRegistry.registerComponent('InfoScreenApp', () => InfoScreenApp);
AppRegistry.registerComponent('ExperienceNuxApp', () => ExperienceNuxAppWithStore);
if (JSCExecutor) {
  JSCExecutor.setContextName('Exponent');
}
