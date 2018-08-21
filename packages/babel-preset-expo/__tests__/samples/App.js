import { AppLoading, Asset } from 'expo';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

@connect()
export default class App extends React.Component {
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
    for (let item of nativeEvent.collection) {
      console.log(item);
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
