import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  DevMenuSettingsType,
  setSettingsAsync,
  getSettingsAsync,
  openDevMenuFromReactNative,
} from '../DevMenuInternal';
import ListFooter from '../components/ListFooter';
import ListItem from '../components/ListItem';
import ListItemCheckbox from '../components/ListItemCheckbox';

type State = {
  settings: DevMenuSettingsType | null;
};

export default class DevMenuSettingsScreen extends React.PureComponent<{}, State> {
  static navigationOptions = {
    headerShown: true,
  };

  state: State = {
    settings: null,
  };

  private pushScreen = () => {
    this.props.navigation.push('Settings');
  };

  private toggleMotionGesture = () => {
    this.saveSettings({ motionGestureEnabled: !this.state.settings?.motionGestureEnabled });
  };

  private toggleTouchGesture = () => {
    this.saveSettings({ touchGestureEnabled: !this.state.settings?.touchGestureEnabled });
  };

  private toggleAutoLaunch = () => {
    this.saveSettings({ showsAtLaunch: !this.state.settings?.showsAtLaunch });
  };

  private saveSettings(newSettings: DevMenuSettingsType) {
    setSettingsAsync(newSettings);
    this.setState(prev => ({ settings: { ...prev.settings, ...newSettings } }));
  }

  private openReactNativeDevMenu = () => {
    openDevMenuFromReactNative();
  };

  componentDidMount() {
    this.refreshSettingsAsync();
  }

  async refreshSettingsAsync() {
    const settings = await getSettingsAsync();
    this.setState({ settings });
  }

  render() {
    const { settings } = this.state;

    if (!settings) {
      return null;
    }

    const shouldLockOneOption =
      [settings.motionGestureEnabled, settings.touchGestureEnabled, settings.showsAtLaunch].filter(
        x => x
      ).length === 1;

    return (
      <View testID="DevMenuSettingsScreen" style={styles.container}>
        <ListItem content="Open React Native dev menu" onPress={this.openReactNativeDevMenu} />
        <View style={styles.group}>
          <ListItemCheckbox
            content="Shake device"
            initialChecked={settings.motionGestureEnabled}
            onChange={this.toggleMotionGesture}
            disabled={shouldLockOneOption && settings.motionGestureEnabled}
          />
          <ListItemCheckbox
            content="Three-finger long press"
            initialChecked={settings.touchGestureEnabled}
            onChange={this.toggleTouchGesture}
            disabled={shouldLockOneOption && settings.touchGestureEnabled}
          />
          <ListItemCheckbox
            content="Show menu at launch"
            initialChecked={settings.showsAtLaunch}
            onChange={this.toggleAutoLaunch}
            disabled={shouldLockOneOption && settings.showsAtLaunch}
          />
          <ListFooter label="Selected gestures will toggle the developer menu." />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
  group: {
    marginVertical: 15,
  },
});
