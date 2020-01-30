/* @flow */

import * as React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';
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
    let { settings } = data;

    return {
      preferredAppearance: settings.preferredAppearance,
    };
  }

  render() {
    return (
      <ScrollView
        style={styles.container}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="on-drag">
        {this._renderAppearanceOptions()}

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

  _renderAppearanceOptions() {
    const { preferredAppearance } = this.props;

    return (
      <View style={{ marginTop: 25 }}>
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
