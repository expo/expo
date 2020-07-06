import React from 'react';
import { Button, View, Image } from 'react-native';
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';

export default class ImageManipulatorSample extends React.Component {
  state = {
    ready: false,
    image: null,
  };

  componentDidMount() {
    (async () => {
      const image = Asset.fromModule(require('./assets/snack-icon.png'));
      await image.downloadAsync();
      this.setState({
        ready: true,
        image,
      });
    })();
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {this.state.ready && this._renderImage()}
        <Button title="Rotate and Flip" onPress={this._rotate90andFlip} />
      </View>
    );
  }

  _rotate90andFlip = async () => {
    const manipResult = await ImageManipulator.manipulateAsync(
      this.state.image.localUri || this.state.image.uri,
      [{ rotate: 90 }, { flip: ImageManipulator.FlipType.Vertical }],
      { compress: 1, format: ImageManipulator.SaveFormat.PNG }
    );
    this.setState({ image: manipResult });
  };

  _renderImage = () => {
    return (
      <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{ uri: this.state.image.localUri || this.state.image.uri }}
          style={{ width: 300, height: 300, resizeMode: 'contain' }}
        />
      </View>
    );
  };
}
