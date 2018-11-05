/* @flow */

import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import PrimaryButton from './PrimaryButton';

@withNavigation
export default class ProfileUnauthenticated extends React.Component {
  render() {
    const title = (Platform.OS === 'ios')
          ? 'Sign in to Continue'
          : 'Your Profile';
    const description = (Platform.OS === 'ios')
          ? 'Sign in or create an Expo account to view your projects.'
          : 'To access your own projects, please sign in or create an Expo account.';
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.titleText}>{title}</Text>

        <Text style={styles.descriptionText}>
          {description}
        </Text>

        {this._renderSignInButton()}
        <View style={{ marginBottom: 20 }} />
        {this._renderSignUpButton()}
      </ScrollView>
    );
  }

  _renderSignInButton() {
    return (
      <PrimaryButton onPress={this._handleSignInPress} fallback={TouchableOpacity}>
        Sign in to your account
      </PrimaryButton>
    );
  }

  _renderSignUpButton() {
    return (
      <PrimaryButton plain onPress={this._handleSignUpPress} fallback={TouchableOpacity}>
        Sign up for Expo
      </PrimaryButton>
    );
  }

  _handleSignInPress = () => {
    this.props.navigation.navigate('SignIn');
  };

  _handleSignUpPress = () => {
    this.props.navigation.navigate('SignUp');
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
