import React from 'react';
import { LinearGradient, takeSnapshotAsync } from 'expo';
import { View, Text, Image, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { captureScreen } from 'react-native-view-shot';

import { Platform } from '@unimodules/core';
import Button from '../components/Button';

// Source: https://codepen.io/zessx/pen/rDEAl <3
const gradientColors = ['#90dffe', '#38a3d1'];

export default class ViewShotScreen extends React.Component {
  static navigationOptions = {
    title: 'ViewShot',
  };

  state = {
    image: null,
    screenUri: null,
  };

  handleRef = ref => {
    this.view = ref;
  };

  handlePress = async () => {
    try {
      const image = await takeSnapshotAsync(this.view, {
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
        const screenUri = await takeSnapshotAsync(null, {
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

  render() {
    const imageSource = this.state.image ? { uri: this.state.image } : null;
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
          source={this.state.screenUri ? { uri: this.state.screenUri } : null}
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
