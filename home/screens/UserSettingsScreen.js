/* @flow */

import Constants from 'expo-constants';
import React from 'react';
import { NativeModules, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import Analytics from '../api/Analytics';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';
import ScrollView from '../components/NavigationScrollView';
import { SectionLabelContainer, GenericCardBody, GenericCardContainer } from '../components/Views';
import { SectionLabelText, GenericCardTitle } from '../components/Text';

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
            underlayColor={Colors.light.greyUnderlayColor}>
            <GenericCardContainer>
              <GenericCardBody style={styles.cardBody}>
                <GenericCardTitle>Sign Out</GenericCardTitle>
              </GenericCardBody>
            </GenericCardContainer>
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
    const twoFingerGestureDescription = `Two-finger ${
      forceTouchAvailable ? 'force touch' : 'long-press'
    }`;

    return (
      <View>
        <SectionLabelContainer>
          <SectionLabelText>EXPO MENU GESTURE</SectionLabelText>
        </SectionLabelContainer>
        <TouchableHighlight
          onPress={() => this._setLegacyMenuGestureAsync(false)}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>{Constants.isDevice ? 'Shake device' : '\u2318D'}</GenericCardTitle>
            </GenericCardBody>
            {legacyMenuGesture === false && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={() => this._setLegacyMenuGestureAsync(true)}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>
                {Constants.isDevice ? twoFingerGestureDescription : 'Expo Button'}
              </GenericCardTitle>
            </GenericCardBody>
            {legacyMenuGesture && this._renderCheckmark()}
          </GenericCardContainer>
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
        <Ionicons name="ios-checkmark" size={35} color={Colors.light.tintColor} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
