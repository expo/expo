import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import * as Sharing from 'expo-sharing';
import Button from '../components/Button';

// https://www.deviantart.com/squishypanda96/art/ceci-n-est-pas-un-chapeau-296137053
const image = require('../../assets/images/chapeau.png');

export default class SharingScreen extends React.Component {
  static navigationOptions = {
    title: 'Sharing',
  };

  state = {
    loading: true,
    isAvailable: false,
  };

  componentDidMount() {
    Sharing.isAvailableAsync().then(isAvailable =>
      this.setState({ isAvailable, loading: false })
    );
  }

  _shareLocalImage = async () => {
    const asset = Asset.fromModule(image);
    await asset.downloadAsync();

    try {
      await Sharing.shareAsync(asset.localUri!, {
        dialogTitle: 'Is it a snake or a hat?',
      });
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <Image source={image} style={styles.image} resizeMode="contain" />
        <Button
          onPress={this._shareLocalImage}
          title="Share local image"
          disabled={!this.state.isAvailable}
          loading={this.state.loading}
        />
        {!this.state.isAvailable && !this.state.loading && (
          <Text>Sharing functionality is not available on this platform.</Text>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  image: {
    marginBottom: 30,
    width: '100%',
    flex: 1,
  },
});
