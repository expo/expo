import Exponent from 'exponent';
import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {
  NavigationProvider,
  StackNavigation,
} from '@exponent/ex-navigation';
import {
  ActionSheetProvider,
} from '@exponent/react-native-action-sheet';
import {
  ApolloProvider,
} from 'react-apollo';

import Actions from './state/actions';
import ApolloClient from './api/ApolloClient';
import LocalStorage from './state/LocalStorage';
import Router from './navigation/Router';
import Store from './state/Store';
import customNavigationContext from './navigation/customNavigationContext';

export default class AppContainer extends React.Component {
  state = {
    isReady: false,
  }

  async componentDidMount() {
    let storedAuthTokens = await LocalStorage.getAuthTokensAsync();

    if (storedAuthTokens) {
      Store.dispatch(Actions.setAuthTokens(storedAuthTokens));
    }

    this.setState({isReady: true});
  }

  render() {
    return (
      <View style={styles.container}>
        <ApolloProvider client={ApolloClient} store={Store}>
          <ActionSheetProvider>
            <NavigationProvider context={customNavigationContext}>
              { this.state.isReady && (
                <StackNavigation
                  id="root"
                  initialRoute={"rootNavigation"}
                />
              )}
            </NavigationProvider>
          </ActionSheetProvider>
        </ApolloProvider>

        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {Platform.OS === 'android' && <View style={styles.statusBarUnderlay} />}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  statusBarUnderlay: {
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.2)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
