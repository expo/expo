import { Ionicons } from '@expo/vector-icons';
import AppLoading from 'expo-app-loading';
import { Asset } from 'expo-asset';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';

class App extends React.Component {
  state = { assetsAreLoaded: false };

  componentDidMount() {
    this._loadAssetsAsync().done();
  }

  render() {
    if (!this.state.assetsAreLoaded) {
      return <AppLoading />;
    } else {
      return (
        <View style={styles.container}>
          <Ionicons name="md-options" size={28} />
        </View>
      );
    }
  }

  async _loadAssetsAsync() {
    try {
      await Asset.loadAsync([require('./assets/icon.png')]);
    } finally {
      this.setState({ assetsAreLoaded: true });
    }
  }

  _handleEventAsync = async ({ nativeEvent, type = 'Event' }) => {
    console.log(type);
    for (const item of nativeEvent.collection) {
      console.log(item);
    }
  };
}

export default connect()(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
