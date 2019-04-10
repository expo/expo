import { ImageManipulator, Asset } from 'expo';
import React from 'react';
import { View, Image } from 'react-native';

export default class App extends React.Component {
  state = { images: null };

  async componentDidMount() {
    const image = Asset.fromModule(require('../assets/example_image_1.jpg'));
    await image.downloadAsync();

    const actions = [
      [{ resize: { width: 20 } }],
      [
        {
          crop: {
            originX: 0,
            originY: 0,
            width: 100,
            height: 200,
          },
        },
      ],
      [{ flip: ImageManipulator.FlipType.Vertical }, { rotate: 45 }],
    ];

    const images = await Promise.all(
      actions.map(async actions => {
        return ImageManipulator.manipulateAsync(image.localUri, actions);
      })
    );
    this.setState({ images });
  }

  render() {
    if (!this.state.images) {
      return <View />;
    }
    return (
      <View style={{ flex: 1 }}>
        {this.state.images.map((image, index) => {
          return (
            <Image
              key={index + '--'}
              resizeMode="contain"
              source={image}
              accessibilityLabel={'target-' + index}
              style={{ width: 300, height: 300 }}
            />
          );
        })}
      </View>
    );
  }
}
