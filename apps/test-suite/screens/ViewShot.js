import { LinearGradient, takeSnapshotAsync } from 'expo';
import React from 'react';
import { View, StyleSheet, Image, Text } from 'react-native';

export default class App extends React.Component {
  state = { image: null };

  attemptPhoto = async () => {
    if (!this.state.image && this.imageLoaded && this.view) {
      const uri = await takeSnapshotAsync(this.view, {
        format: 'jpg',
        quality: 0.8,
        result: 'data-uri',
      });
      this.setState({ image: { uri } });
    }
  };
  render() {
    return (
      <View
        style={{ width: 500, height: 500 }}
        ref={async ref => {
          this.view = ref;
          this.attemptPhoto();
        }}>
        <LinearGradient
          colors={['red', 'orange', 'cyan']}
          locations={[0.1, 0.5, 0.8]}
          start={[0, 1]}
          end={[1, 0.2]}
          style={{ width: 300, height: 300 }}
        />
        <Image
          style={{ width: 100, height: 100, resizeMode: 'contain' }}
          source={require('../assets/icons/app.png')}
          onLoadEnd={() => {
            this.imageLoaded = true;
            this.attemptPhoto();
          }}
        />
        <Text style={{ fontSize: 24, color: 'orange', fontWeight: 'bold' }}>Some Text</Text>

        {this.state.image && (
          <Image
            accessibilityLabel="target-000"
            style={StyleSheet.absoluteFill}
            resizeMode="contain"
            source={this.state.image}
          />
        )}
      </View>
    );
  }
}
