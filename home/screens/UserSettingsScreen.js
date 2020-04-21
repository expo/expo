/* @flow */

import * as React from 'react';
import { Platform, StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { connect } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import SessionActions from '../redux/SessionActions';
import SettingsActions from '../redux/SettingsActions';
import ScrollView from '../components/NavigationScrollView';
import { SectionLabelContainer, GenericCardBody, GenericCardContainer } from '../components/Views';
import { SectionLabelText, GenericCardTitle } from '../components/Text';

@connect(data => UserSettingsScreen.getDataProps(data))
export default class UserSettingsScreen extends React.Component {
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

  _setPreferredAppearance = (preferredAppearance: 'light' | 'dark' | 'automatic') => {
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
      <View style={styles.sectionWrapper}>
        <SectionLabelContainer>
          <SectionLabelText>THEME</SectionLabelText>
        </SectionLabelContainer>
        <TouchableHighlight
          onPress={() => this._setPreferredAppearance('no-preference')}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>Automatic</GenericCardTitle>
            </GenericCardBody>
            {preferredAppearance === 'no-preference' && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={() => this._setPreferredAppearance('light')}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>Light</GenericCardTitle>
            </GenericCardBody>
            {preferredAppearance === 'light' && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={() => this._setPreferredAppearance('dark')}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>Dark</GenericCardTitle>
            </GenericCardBody>
            {preferredAppearance === 'dark' && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <View style={SharedStyles.genericCardDescriptionContainer}>
          <Text style={SharedStyles.genericCardDescriptionText}>
            Automatic is only supported on operating systems that allow you to control the
            system-wide color scheme.
          </Text>
        </View>
      </View>
    );
  }

  _renderMenuGestureOptions() {
    const { devMenuSettings } = this.props;

    if (!devMenuSettings || Platform.OS !== 'ios') {
      return null;
    }

    return (
      <View style={styles.sectionWrapper}>
        <SectionLabelContainer>
          <SectionLabelText>DEVELOPER MENU GESTURES</SectionLabelText>
        </SectionLabelContainer>
        <TouchableHighlight
          onPress={this._toggleMotionGesture}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>Shake device</GenericCardTitle>
            </GenericCardBody>
            {devMenuSettings.motionGestureEnabled && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <TouchableHighlight
          onPress={this._toggleTouchGesture}
          underlayColor={Colors.light.greyUnderlayColor}
          style={styles.button}>
          <GenericCardContainer>
            <GenericCardBody style={styles.cardBody}>
              <GenericCardTitle>Three-finger long press</GenericCardTitle>
            </GenericCardBody>
            {devMenuSettings.touchGestureEnabled && this._renderCheckmark()}
          </GenericCardContainer>
        </TouchableHighlight>

        <View style={SharedStyles.genericCardDescriptionContainer}>
          <Text style={SharedStyles.genericCardDescriptionText}>
            Selected gestures will toggle the developer menu while inside an experience. The menu allows
            you to reload or return to home in a published experience, and exposes developer tools
            in development mode.
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
  sectionWrapper: {
    marginTop: 25,
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
