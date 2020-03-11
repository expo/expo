import { AppLoading } from 'expo';
import * as React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { NavigationNavigator } from 'react-navigation';

import loadAssetsAsync from '../utilities/loadAssetsAsync';

const initialState = {
  appIsReady: false,
};

type State = typeof initialState;

export default function LoadAssetsNavigationWrapper(InnerNavigator: NavigationNavigator) {
  const LoadAssetsCustomNavigator = class LoadAssetsCustomNavigator extends React.Component<
    any,
    State
  > {
    readonly state: State = initialState;
    router = InnerNavigator.router;

    componentDidMount() {
      this._loadAssetsAsync();
    }

    async _loadAssetsAsync() {
      try {
        await loadAssetsAsync();
      } catch (e) {
        console.log({ e });
      } finally {
        this.setState({ appIsReady: true });
      }
    }

    render() {
      if (this.state.appIsReady) {
        return <InnerNavigator {...this.props} />;
      } else {
        if (AppLoading) {
          return <AppLoading />;
        } else {
          return (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" />
            </View>
          );
        }
      }
    }
  };

  // @ts-ignore
  LoadAssetsCustomNavigator.router = InnerNavigator.router;

  return LoadAssetsCustomNavigator;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
