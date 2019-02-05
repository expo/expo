import React from 'react';
import { ScrollView, Text } from 'react-native';
import { ScreenOrientation } from 'expo';
import { Platform } from 'expo-react-native-adapter';
import ListButton from '../components/ListButton';

export default class ScreenOrientationScreen extends React.Component {
  static navigationOptions = {
    title: 'ScreenOrientation',
  };

  state = {
    orientation: undefined,
  };
  async componentDidMount() {
    this.listener = ScreenOrientation.addOrientationChangeListener(async () => {
      await this.updateOrientationAsync();
    });
    await this.updateOrientationAsync();
  }

  updateOrientationAsync = async () => {
    this.setState({
      orientation: (await ScreenOrientation.getOrientationAsync()).orientation,
    });
  };

  componentWillUnmount() {
    if (this.listener) {
      this.listener.remove();
    }
  }

  lock = async orientation => {
    if (Platform.OS === 'web') {
      // most web browsers require fullscreen in order to change screen orientation
      await document.documentElement.requestFullscreen();
    }

    await ScreenOrientation.lockAsync(orientation).catch(console.warn); // on iPhoneX PortraitUpsideDown would be rejected

    if (Platform.OS === 'web') {
      await document.exitFullscreen();
    }
  };

  lockPlatformExample = async () => {
    if (Platform.OS === 'web') {
      // most web browsers require fullscreen in order to change screen orientation
      await document.documentElement.requestFullscreen();
    }

    await ScreenOrientation.lockPlatformAsync({
      screenOrientationArrayWeb: [
        ScreenOrientation.Orientation.PORTRAIT_DOWN,
        ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ],
      screenOrientationArrayIOS: [
        ScreenOrientation.Orientation.PORTRAIT_DOWN,
        ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ],
      screenOrientationConstantAndroid: 8, // reverse landscape
    }).catch(console.warn); // on iPhoneX PortraitUpsideDown would be rejected
  };

  doesSupport = async () => {
    const result = await ScreenOrientation.supportsOrientationLockAsync(
      ScreenOrientation.Orientation.PORTRAIT_DOWN
    ).catch(console.warn);
    alert(`Orientation.PORTRAIT_DOWN supported: ${JSON.stringify(result)}`);
  };

  unlock = async () => {
    await ScreenOrientation.unlockAsync().catch(console.warn);
  };

  render() {
    const { orientation } = this.state;
    return (
      <ScrollView style={{ padding: 10 }}>
        {orientation && <Text>Orientation: {orientation}</Text>}
        {Object.keys(ScreenOrientation.Orientation).map(orientation => (
          <ListButton
            key={orientation}
            onPress={() => this.lock(orientation)}
            title={orientation}
          />
        ))}
        <ListButton
          key="lockPlatformAsync Example"
          onPress={this.lockPlatformExample}
          title="Apply a custom native lock"
        />
        <ListButton
          key="doesSupport"
          onPress={this.doesSupport}
          title="Check Orientation.PORTRAIT_DOWN support"
        />
        <ListButton
          key="unlock"
          onPress={this.unlock}
          title="unlock orientation back to default settings"
        />
      </ScrollView>
    );
  }
}
