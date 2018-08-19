// @flow

import * as React from 'react';
import { NativeModules, StyleSheet, Text, View } from 'react-native';

import { getAppLoadingLifecycleEmitter } from './AppLoading';

type Props = {
  children: React.ChildrenArray<React.Node>,
};

type State = {
  error: ?Error,
};

export default class RootErrorBoundary extends React.Component<Props, State> {
  state = {
    error: null,
  };

  _appLoadingIsMounted = false;

  componentWillMount() {
    // In production the app will just hard crash on errors, unless the developer decides to handle
    // them by overriding the global error handler and swallowing the error, in which case they are
    // responsible for determining how to recover from this state.
    if (__DEV__) {
      getAppLoadingLifecycleEmitter().once('componentDidMount', this._subscribeToGlobalErrors);
      getAppLoadingLifecycleEmitter().once(
        'componentWillUnmount',
        this._unsubscribeFromGlobalErrors
      );
    }
  }

  _subscribeToGlobalErrors = () => {
    this._appLoadingIsMounted = true;

    let ErrorUtils = global.ErrorUtils;
    let originalErrorHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      if (this._appLoadingIsMounted) {
        NativeModules.ExponentAppLoadingManager &&
          NativeModules.ExponentAppLoadingManager.finishedAsync();

        if (isFatal) {
          this.setState({ error });
        }
      }

      originalErrorHandler(error, isFatal);
    });
  };

  _unsubscribeFromGlobalErrors = () => {
    // We don't remove the global error handler that we set here because it is conceivable that the
    // user may add error handlers *after* we subscribe, and we don't want to override those, so
    // instead we just gate call
    this._appLoadingIsMounted = false;
  };

  // Test this by adding `throw new Error('example')` to your root component
  componentDidCatch(error: Error) {
    if (this._appLoadingIsMounted) {
      NativeModules.ExponentAppLoadingManager &&
        NativeModules.ExponentAppLoadingManager.finishedAsync();

      this.setState({ error });
    }

    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={[styles.paragraph, { color: '#000' }]}>
            A fatal error was encountered while rendering the root component.
          </Text>
          <Text style={styles.paragraph}>
            Review your application logs for more information, and reload the app when the issue is
            resolved. In production, your app would have crashed.
          </Text>
        </View>
      );
    } else {
      return this.props.children;
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    marginBottom: 10,
    textAlign: 'center',
    marginHorizontal: 30,
    maxWidth: 350,
    fontSize: 15,
    color: '#888',
  },
  warningIcon: {
    fontSize: 40,
    marginBottom: 20,
  },
});
