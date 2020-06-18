import { AppLoading } from 'expo';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import loadAssetsAsync from '../utilities/loadAssetsAsync';

export default function LoadAssetsNavigationWrapper<T>(InnerNavigator: React.FC<T>) {
  function LoadAssetsCustomNavigator(props: T) {
    const [isReady, setReady] = React.useState(false);

    React.useEffect(() => {
      _loadAssetsAsync();
    }, []);

    const _loadAssetsAsync = async () => {
      try {
        await loadAssetsAsync();
      } catch (e) {
        console.log({ e });
      } finally {
        setReady(true);
      }
    };

    if (isReady) {
      return <InnerNavigator {...props} />;
    }
    if (AppLoading) {
      return <AppLoading />;
    }
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return LoadAssetsCustomNavigator;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
