import * as React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { NavigationInjectedProps } from 'react-navigation';
import { connect } from 'react-redux';

import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import SectionFooter from '../components/SectionFooter';
import SectionHeader from '../components/SectionHeader';
import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';

type PreferredAppearance = 'light' | 'dark' | 'no-preference';

type Props = NavigationInjectedProps & {
  preferredAppearance: PreferredAppearance;
  devMenuSettings: any;
};

@connect(data => UserSettingsScreen.getDataProps(data))
export default class UserSettingsScreen extends React.Component<Props> {
  static navigationOptions = {
    title: 'Options',
  };

  static getDataProps(data) {
    const { settings } = data;

    return {
      preferredAppearance: settings.preferredAppearance,
      devMenuSettings: settings.devMenuSettings,
    };
  }

  render() {
    return (
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag">
        {this._renderAppearanceOptions()}
        {this._renderMenuGestureOptions()}
        {this._renderSignOut()}
      </ScrollView>
    );
  }

  _handlePressSignOut = () => {
    this.props.dispatch(SessionActions.signOut());
    requestAnimationFrame(this.props.navigation.pop);
  };

  _setPreferredAppearance = (preferredAppearance: PreferredAppearance) => {
    this.props.dispatch(SettingsActions.setPreferredAppearance(preferredAppearance));
  };

  _toggleMotionGesture = () => {
    this.props.dispatch(
      SettingsActions.setDevMenuSetting(
        'motionGestureEnabled',
        !this.props.devMenuSettings.motionGestureEnabled
      )
    );
  };

  _toggleTouchGesture = () => {
    this.props.dispatch(
      SettingsActions.setDevMenuSetting(
        'touchGestureEnabled',
        !this.props.devMenuSettings.touchGestureEnabled
      )
    );
  };

  _renderAppearanceOptions() {
    const { preferredAppearance } = this.props;

    return (
      <View style={styles.marginTop}>
        <SectionHeader title="Theme" />
        <ListItem
          title="Automatic"
          checked={preferredAppearance === 'no-preference'}
          onPress={() => this._setPreferredAppearance('no-preference')}
        />
        <ListItem
          title="Light"
          checked={preferredAppearance === 'light'}
          onPress={() => this._setPreferredAppearance('light')}
        />
        <ListItem
          last
          margins={false}
          title="Dark"
          checked={preferredAppearance === 'dark'}
          onPress={() => this._setPreferredAppearance('dark')}
        />
        <SectionFooter
          title="Automatic is only supported on operating systems that allow you to control the
            system-wide color scheme."
        />
      </View>
    );
  }

  _renderMenuGestureOptions() {
    const { devMenuSettings } = this.props;

    if (!devMenuSettings || Platform.OS !== 'ios') {
      return null;
    }

    return (
      <View style={styles.marginTop}>
        <SectionHeader title="Developer Menu Gestures" />
        <ListItem
          title="Shake device"
          checked={devMenuSettings.motionGestureEnabled}
          onPress={this._toggleMotionGesture}
        />
        <ListItem
          title="Three-finger long press"
          checked={devMenuSettings.touchGestureEnabled}
          onPress={this._toggleTouchGesture}
        />
        <SectionFooter title="Selected gestures will toggle the developer menu while inside an experience. The menu allows you to reload or return to home in a published experience, and exposes developer tools in development mode." />
      </View>
    );
  }

  _renderSignOut() {
    return (
      <ListItem style={styles.marginTop} title="Sign Out" onPress={this._handlePressSignOut} last />
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  marginTop: {
    marginTop: 25,
  },
});
