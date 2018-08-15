/* @flow */

import React from 'react';
import {
  NativeModules,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { Constants } from 'expo';

import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import Analytics from '../api/Analytics';

const forceTouchAvailable =
  (NativeModules.PlatformConstants && NativeModules.PlatformConstants.forceTouchAvailable) || false;

@connect(data => UserSettingsScreen.getDataProps(data))
export default class UserSettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Options',
  };

  static getDataProps(data) {
    let { settings } = data;

    return {
      legacyMenuGesture: settings.legacyMenuGesture,
    };
  }

  render() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingTop: 15 }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag">
        {this._renderMenuGestureOptions()}

        <View style={{ marginTop: 30 }}>
          <TouchableHighlight
            onPress={this._handlePressSignOut}
            underlayColor={Colors.greyUnderlayColor}
            style={styles.button}>
            <View style={[SharedStyles.genericCardContainer, { backgroundColor: 'transparent' }]}>
              <View style={styles.cardBody}>
                <Text style={SharedStyles.genericCardTitle}>Sign Out</Text>
              </View>
            </View>
          </TouchableHighlight>
        </View>
      </ScrollView>
    );
  }

  _handlePressSignOut = () => {
    this.props.dispatch(SessionActions.signOut());
    requestAnimationFrame(this.props.navigation.pop);
  };

  _setLegacyMenuGestureAsync = (useLegacyGesture: boolean) => {
    Analytics.track(Analytics.events.USER_UPDATED_SETTINGS, {
      useLegacyGesture,
    });

    this.props.dispatch(SettingsActions.setIsLegacyMenuBehaviorEnabled(useLegacyGesture));
  };

  _renderMenuGestureOptions() {
    const { legacyMenuGesture } = this.props;
    const twoFingerGestureDescription = `Two-finger ${forceTouchAvailable
      ? 'force touch'
      : 'long-press'}`;

    return (
      <View>
        <View style={SharedStyles.sectionLabelContainer}>
          <Text style={SharedStyles.sectionLabelText}>EXPO MENU GESTURE</Text>
        </View>
        <TouchableHighlight
          onPress={() => this._setLegacyMenuGestureAsync(false)}
          underlayColor={Colors.greyUnderlayColor}
          style={styles.button}>
          <View style={[SharedStyles.genericCardContainer, { backgroundColor: 'transparent' }]}>
            <View style={styles.cardBody}>
              <Text style={SharedStyles.genericCardTitle}>
                {Constants.isDevice ? 'Shake device' : '\u2318D'}
              </Text>
            </View>
            {legacyMenuGesture === false && this._renderCheckmark()}
          </View>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={() => this._setLegacyMenuGestureAsync(true)}
          underlayColor={Colors.greyUnderlayColor}
          style={styles.button}>
          <View style={[SharedStyles.genericCardContainer, { backgroundColor: 'transparent' }]}>
            <View style={styles.cardBody}>
              <Text style={SharedStyles.genericCardTitle}>
                {Constants.isDevice ? twoFingerGestureDescription : 'Expo Button'}
              </Text>
            </View>
            {legacyMenuGesture && this._renderCheckmark()}
          </View>
        </TouchableHighlight>

        <View style={SharedStyles.genericCardDescriptionContainer}>
          <Text style={SharedStyles.genericCardDescriptionText}>
            This gesture will toggle the Expo Menu while inside an experience. The menu allows you
            to reload or return to home in a published experience, and exposes developer tools in
            development mode.
          </Text>
        </View>
      </View>
    );
  }

  _renderCheckmark() {
    return (
      <View style={styles.cardIconRight}>
        <Ionicons name="ios-checkmark" size={35} color={Colors.tintColor} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  cardBody: {
    paddingTop: 15,
    paddingLeft: 15,
    paddingRight: 10,
    paddingBottom: 12,
  },
  cardIconRight: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#fff',
  },
});
