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
    orientationLock: undefined,
    orientationInfo: undefined,
  };
  async componentDidMount() {
    this.listener = ScreenOrientation.addOrientationChangeListener(async () => {
      this.updateOrientationAsync();
    });
    this.updateOrientationAsync();
  }

  updateOrientationAsync = async () => {
    this.setState({
      orientationLock: await ScreenOrientation.getPlatformOrientationLockAsync(),
      orientationInfo: (await ScreenOrientation.getOrientationAsync()).orientation,
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

  doesSupport = async () => {
    const result = await ScreenOrientation.supportsOrientationLockAsync(
      ScreenOrientation.Orientation.PORTRAIT_DOWN
    ).catch(console.warn);
    alert(`Orientation.PORTRAIT_DOWN supported: ${JSON.stringify(result)}`);
  };

  render() {
    const { orientationLock, orientationInfo } = this.state;
    return (
      <ScrollView style={{ padding: 10 }}>
        {orientationLock && <Text>Angle: {JSON.stringify(orientationLock, null, 2)}</Text>}
        {orientationInfo && <Text>Orientation: {orientationInfo}</Text>}
        {Object.keys(ScreenOrientation.Orientation).map(orientation => (
          <ListButton
            key={orientation}
            onPress={() => this.lock(orientation)}
            title={orientation}
          />
        ))}
        <ListButton
          key="doesSupport"
          onPress={this.doesSupport}
          title="Check Orientation.PORTRAIT_DOWN support"
        />
      </ScrollView>
    );
  }
}
