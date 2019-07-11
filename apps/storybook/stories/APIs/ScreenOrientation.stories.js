import * as ScreenOrientation from 'expo/build/ScreenOrientation/ScreenOrientation';
import React from 'react';
import {
  PixelRatio,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

export const title = 'Screen Orientation';
export const packageJson = require('expo/package.json');
export const label = 'ScreenOrientation';

export const description = (
  <>
    Screen Orientation is defined as the orientation in which graphics are painted on the device.
    For example, the figure below has a device in a vertical and horizontal physical orientation,
    but a portrait screen orientation. For physical device orientation, see the orientation section
    of [Device Motion](../devicemotion/). ![Portrait orientation in different physical
    orientations](/static/images/screen-orientation-portrait.png) This API allows changing supported
    screen orientations at runtime. This will take priority over the `orientation` key in
    `app.json`. On both iOS and Android platforms, changes to the screen orientation will override
    any system settings or user preferences. On Android, it is possible to change the screen
    orientation while taking the user's preferred orientation into account. On iOS, user and system
    settings are not accessible by the application and any changes to the screen orientation will
    override existing settings.
  </>
);
class ListButton extends React.Component {
  render() {
    const style = [styles.button];
    const labelStyles = [styles.label];
    if (this.props.disabled) {
      style.push(styles.disabledButton);
      labelStyles.push(styles.disabledLabel);
    }
    return (
      <View style={[styles.container, this.props.style]}>
        <TouchableHighlight
          style={style}
          disabled={this.props.disabled}
          onPress={this.props.onPress}
          underlayColor="#dddddd">
          <Text style={labelStyles}>{this.props.title}</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

export class component extends React.Component {
  state = {};
  _isMounted = false;
  async componentDidMount() {
    this._isMounted = true;
    this.listener = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo, orientationLock }) => {
        this.setState({
          orientation: orientationInfo.orientation,
          orientationLock,
        });
      }
    );
    const [orientation, orientationLock] = await Promise.all([
      ScreenOrientation.getOrientationAsync().then(({ orientation }) => orientation),
      ScreenOrientation.getOrientationLockAsync(),
    ]);
    if (this._isMounted) {
      // update state
      this.setState({
        orientation,
        orientationLock,
      });
    }
  }

  updateOrientationAsync = async () => {
    this.setState({
      orientation: (await ScreenOrientation.getOrientationAsync()).orientation,
    });
  };

  componentWillUnmount() {
    this._isMounted = false;
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
      screenOrientationLockWeb: ScreenOrientation.WebOrientationLock.LANDSCAPE,
      screenOrientationArrayIOS: [
        ScreenOrientation.Orientation.PORTRAIT_DOWN,
        ScreenOrientation.Orientation.LANDSCAPE_RIGHT,
      ],
      screenOrientationConstantAndroid: 8, // reverse landscape
    }).catch(e => alert(e)); // on iPhoneX PortraitUpsideDown would be rejected
    if (Platform.OS === 'web') {
      await document.exitFullscreen();
    }
  };

  doesSupport = async () => {
    const result = await ScreenOrientation.supportsOrientationLockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_DOWN
    ).catch(console.warn);
    alert(`Orientation.PORTRAIT_DOWN supported: ${JSON.stringify(result)}`);
  };

  unlock = async () => {
    await ScreenOrientation.unlockAsync().catch(console.warn);
  };

  render() {
    const { orientation, orientationLock } = this.state;
    return (
      <ScrollView style={{ padding: 10 }}>
        {orientation && <Text>Orientation: {orientation}</Text>}
        {orientationLock && <Text>OrientationLock: {orientationLock}</Text>}
        {Object.keys(ScreenOrientation.Orientation).map(o => (
          <ListButton key={o} onPress={() => this.lock(o)} title={o} />
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

const styles = StyleSheet.create({
  container: {},
  button: {
    paddingVertical: 10,
    backgroundColor: 'transparent',
    borderBottomWidth: 1.0 / PixelRatio.get(),
    borderBottomColor: '#cccccc',
  },
  disabledButton: {},
  label: {
    color: 'blue',
    fontWeight: '700',
  },
  disabledLabel: {
    color: '#999999',
  },
});
