/* @flow */

import React from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { withNavigation } from '@exponent/ex-navigation';

import Exponent from 'exponent';
import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';

@withNavigation
export default class ProfileUnauthenticated extends React.Component {
  render() {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}>
        <Text style={styles.titleText}>
          Your Profile
        </Text>

        <Text style={styles.descriptionText}>
          To access your own projects or to like projects created by others,
          please sign in or create an Expo account.
        </Text>

        {this._renderSignInButton()}
        <View style={{ marginBottom: 20 }} />
        {this._renderSignUpButton()}
      </ScrollView>
    );
  }

  _renderSignInButton() {
    return (
      <PrimaryButton
        onPress={this._handleSignInPress}
        fallback={TouchableOpacity}>
        Sign in to your account
      </PrimaryButton>
    );
  }

  _renderSignUpButton() {
    return (
      <PrimaryButton
        plain
        onPress={this._handleSignUpPress}
        fallback={TouchableOpacity}>
        Sign up for Expo
      </PrimaryButton>
    );
  }

  _handleSignInPress = () => {
    this.props.navigation.showModal('signIn');
  };

  _handleSignUpPress = () => {
    this.props.navigation.showModal('signUp');
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.greyBackground,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
  },
  titleText: {
    color: '#232b3a',
    marginBottom: 15,
    fontWeight: '400',
    ...Platform.select({
      ios: {
        fontSize: 22,
      },
      android: {
        fontSize: 23,
      },
    }),
  },
  descriptionText: {
    color: 'rgba(36, 44, 58, 0.7)',
    textAlign: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        fontSize: 15,
        lineHeight: 20,
      },
      android: {
        fontSize: 16,
        lineHeight: 24,
      },
    }),
  },
});
