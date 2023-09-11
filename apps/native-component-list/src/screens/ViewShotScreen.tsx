import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { Platform } from 'expo-modules-core';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { captureRef as takeSnapshotAsync, captureScreen } from 'react-native-view-shot';

import Button from '../components/Button';

// Source: https://codepen.io/zessx/pen/rDEAl <3
const gradientColors = ['#90dffe', '#38a3d1'];

interface State {
  image?: string;
  screenUri?: string;
}

export default class ViewShotScreen extends React.Component<object, State> {
  static navigationOptions = {
    title: 'ViewShot',
  };

  readonly state: State = {};
  view?: View;

  handleRef = (ref: View) => {
    this.view = ref;
  };

  handlePress = async () => {
    try {
      const image = await takeSnapshotAsync(this.view!, {
        format: 'png',
        quality: 0.5,
        result: 'data-uri',
      });
      this.setState({ image });
    } catch (e) {
      console.error(e);
    }
  };

  handleScreenCapturePress = async () => {
    if (Platform.OS === 'web') {
      try {
        const screenUri = await takeSnapshotAsync(undefined as unknown as number, {
          format: 'jpg',
          quality: 0.8,
          result: 'data-uri',
        });
        this.setState({ screenUri });
      } catch (e) {
        console.error(e);
      }
      return;
    }
    const uri = await captureScreen({
      format: 'jpg',
      quality: 0.8,
    });
    this.setState({ screenUri: uri });
  };

  handleAddToMediaLibraryPress = async () => {
    const uri = this.state.screenUri;

    if (uri) {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status === 'granted') {
        await MediaLibrary.createAssetAsync(uri);
        alert('Successfully added captured screen to media library');
      } else {
        alert('Media library permissions not granted');
      }
    }
  };

  render() {
    const imageSource = { uri: this.state.image };
    return (
      <ScrollView contentContainerStyle={{ alignItems: 'center' }}>
        <View style={styles.snapshotContainer} ref={this.handleRef} collapsable={false}>
          <LinearGradient
            colors={gradientColors}
            style={styles.gradient}
            start={[0, 0]}
            end={[0, 1]}>
            <Image style={styles.snapshot} source={imageSource} />
            <Text style={styles.text}>Snapshot will show above</Text>
          </LinearGradient>
        </View>
        <Button style={styles.button} onPress={this.handlePress} title="TAKE THE (SNAP)SHOT!" />
        <Button
          style={styles.button}
          onPress={this.handleScreenCapturePress}
          title="Capture whole screen"
        />
        <Image
          style={{
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
            borderColor: '#f00',
            borderWidth: 10,
          }}
          source={{ uri: this.state.screenUri }}
        />
        <Button
          style={styles.button}
          disabled={!this.state.screenUri}
          onPress={this.handleAddToMediaLibraryPress}
          title="Add to media library"
        />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  snapshotContainer: {
    height: 200,
    alignSelf: 'stretch',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
  },
  snapshot: {
    width: 150,
    height: 150,
  },
  text: {
    margin: 10,
    color: '#fff',
    fontWeight: '700',
  },
  button: {
    margin: 15,
  },
});
