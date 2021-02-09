import React from 'react';
import { StyleSheet, Button, View, Image, Text } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default class App extends React.Component {
  state = {
    image: null,
  };

  generateThumbnail = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        'http://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
        {
          time: 15000,
        }
      );
      this.setState({ image: uri });
    } catch (e) {
      console.warn(e);
    }
  };

  render() {
    const { image } = this.state;
    return (
      <View style={styles.container}>
        <Button onPress={this.generateThumbnail} title="Generate thumbnail" />
        {image && <Image source={{ uri: image }} style={{ width: 200, height: 200 }} />}
        <Text>{image}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
});
