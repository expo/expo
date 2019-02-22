import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Sharing, FileSystem, } from 'expo';
import Button from '../components/Button';

const REMOTE_IMAGE =
  'https://images.pexels.com/photos/825262/pexels-photo-825262.jpeg?auto=compress&cs=tinysrgb&h=350';

export default class SharingScreen extends React.Component {
  static navigationOptions = {
    title: 'Sharing',
  };

  state = {
    loading: false,
  };

  _shareLocalImage = async () => {
    this.setState({
      loading: true,
    });
    const response = await FileSystem.downloadAsync(
      REMOTE_IMAGE,
      FileSystem.documentDirectory + 'sample_image.jpeg',
    );

    const { uri: imageUri } = response;

    this.setState({
      loading: false,
    });

    try {
      await Sharing.shareAsync(imageUri, {
        mimeType: 'image/jpg',
      });
    } catch (e) {
      console.error(e);
    }
  };

  render() {
    return (
      <View style={styles.container}>
        <Image source={{ uri: REMOTE_IMAGE }} style={styles.image} resizeMode="contain" />
        <Button
          onPress={this._shareLocalImage}
          title="Share local image"
          loading={this.state.loading}
        />
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
  }
});
