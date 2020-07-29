import React from 'react';
import { StyleSheet, View } from 'react-native';

import { DevMenuSettingsType, setSettingsAsync, getSettingsAsync } from '../DevMenuInternal';
import ListItemCheckbox from '../components/ListItemCheckbox';
import ListFooter from '../components/ListFooter';

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
    setSettingsAsync({ motionGestureEnabled: !this.state.settings?.motionGestureEnabled });
  };

  private toggleTouchGesture = () => {
    setSettingsAsync({ touchGestureEnabled: !this.state.settings?.touchGestureEnabled });
  };

  private toggleAutoLaunch = () => {
    setSettingsAsync({ showsAtLaunch: !this.state.settings?.showsAtLaunch });
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
    return (
      <View style={styles.container}>
        <ListItemCheckbox
          title="Shake device"
          initialChecked={settings.motionGestureEnabled}
          onChange={this.toggleMotionGesture}
        />
        <ListItemCheckbox
          title="Three-finger long press"
          initialChecked={settings.touchGestureEnabled}
          onChange={this.toggleTouchGesture}
        />
        <ListItemCheckbox
          title="Show menu at launch"
          initialChecked={settings.showsAtLaunch}
          onChange={this.toggleAutoLaunch}
        />
        <ListFooter label="Selected gestures will toggle the developer menu." />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30,
  },
});
