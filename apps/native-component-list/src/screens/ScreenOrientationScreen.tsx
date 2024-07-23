import { Platform, type EventSubscription } from 'expo-modules-core';
import * as ScreenOrientation from 'expo-screen-orientation';
import React from 'react';
import { ScrollView, Text, SafeAreaView } from 'react-native';

import ListButton from '../components/ListButton';

interface State {
  orientation?: ScreenOrientation.Orientation;
  orientationLock?: ScreenOrientation.OrientationLock;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
export default class ScreenOrientationScreen extends React.Component<{}, State> {
  static navigationOptions = {
    title: 'ScreenOrientation',
  };

  readonly state: State = {};

  listener?: EventSubscription;

  async componentDidMount() {
    this.listener = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo, orientationLock }) => {
        this.setState({
          orientation: orientationInfo.orientation,
          orientationLock,
        });
      }
    );

    await this.updateCurrentOrientationAndLock();
  }

  updateCurrentOrientationAndLock = async () => {
    const [orientation, orientationLock] = await Promise.all([
      ScreenOrientation.getOrientationAsync(),
      ScreenOrientation.getOrientationLockAsync(),
    ]);

    // update state
    this.setState({
      orientation,
      orientationLock,
    });
  };

  updateOrientationAsync = async () => {
    this.setState({
      orientation: await ScreenOrientation.getOrientationAsync(),
    });
  };

  componentWillUnmount() {
    if (this.listener) {
      this.listener.remove();
    }
  }

  lock = async (orientation: ScreenOrientation.OrientationLock) => {
    if (Platform.OS === 'web') {
      // most web browsers require fullscreen in order to change screen orientation
      await document.documentElement.requestFullscreen();
    }

    await ScreenOrientation.lockAsync(orientation).catch(console.warn); // on iPhoneX PortraitUpsideDown would be rejected

    if (Platform.OS === 'web') {
      await document.exitFullscreen();
    }

    await this.updateCurrentOrientationAndLock();
  };

  lockPlatformExample = async () => {
    if (Platform.OS === 'web') {
      // most web browsers require fullscreen in order to change screen orientation
      await document.documentElement.requestFullscreen();
    }

    await ScreenOrientation.lockPlatformAsync({
      screenOrientationLockWeb: ScreenOrientation.WebOrientationLock.LANDSCAPE,
      screenOrientationArrayIOS: [
        ScreenOrientation.Orientation.PORTRAIT_DOWN,
        ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ],
      screenOrientationConstantAndroid: 8, // reverse landscape
    }).catch((e) => alert(e)); // on iPhoneX PortraitUpsideDown would be rejected

    if (Platform.OS === 'web') {
      await document.exitFullscreen();
    }

    await this.updateCurrentOrientationAndLock();
  };

  doesSupport = async () => {
    const result = await ScreenOrientation.supportsOrientationLockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_DOWN
    ).catch(console.warn);
    alert(`Orientation.PORTRAIT_DOWN supported: ${JSON.stringify(result)}`);
  };

  getScreenOrientationLockOptions(): {
    key: string;
    value: ScreenOrientation.OrientationLock;
  }[] {
    const orientationOptions = [
      ScreenOrientation.OrientationLock.DEFAULT,
      ScreenOrientation.OrientationLock.ALL,
      ScreenOrientation.OrientationLock.PORTRAIT,
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
      ScreenOrientation.OrientationLock.PORTRAIT_DOWN,
      ScreenOrientation.OrientationLock.LANDSCAPE,
      ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
      ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT,
    ];

    return orientationOptions.map((orientation) => ({
      key: ScreenOrientation.OrientationLock[orientation],
      value: orientation,
    }));
  }

  render() {
    const { orientation, orientationLock } = this.state;
    return (
      <SafeAreaView>
        <ScrollView style={{ padding: 10 }}>
          {orientation !== undefined && (
            <Text>Orientation: {ScreenOrientation.Orientation[orientation]}</Text>
          )}
          {orientationLock !== undefined && (
            <Text>OrientationLock: {ScreenOrientation.OrientationLock[orientationLock]}</Text>
          )}
          {this.getScreenOrientationLockOptions().map((o) => (
            <ListButton key={o.key} onPress={() => this.lock(o.value)} title={o.key} />
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
            key="updateCurrentOrientationAndLock"
            onPress={this.updateCurrentOrientationAndLock}
            title="Update current orientation and lock"
          />
        </ScrollView>
      </SafeAreaView>
    );
  }
}
