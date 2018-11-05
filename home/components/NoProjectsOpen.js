/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import Colors from '../constants/Colors';

export default class NoProjectsOpen extends React.Component {
  render() {
    const { isAuthenticated } = this.props;
    let message;
    if (isAuthenticated) {
      message = 'No projects are currently open.';
    } else {
      message = 'Sign in to your Expo account to see the projects you have recently been working on.'
    }

    return (
      <View style={[styles.container, styles.bottomBorder]}>
        <View style={styles.infoContainer}>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{message}</Text>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    flex: 1,
    marginBottom: 12,
  },
  bottomBorder: {
    flexGrow: 1,
    borderBottomColor: Colors.separator,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
  },
  infoContainer: {
    paddingTop: 13,
    paddingLeft: 20,
    paddingRight: 10,
    flexDirection: 'column',
    alignSelf: 'stretch',
    paddingBottom: 12,
  },
  titleText: {
    color: Colors.blackText,
    fontSize: 15,
    marginRight: 70,
    marginBottom: 2,
    ...Platform.select({
      ios: {
        fontWeight: '500',
      },
      android: {
        fontWeight: '400',
        marginTop: 1,
      },
    }),
  },
  subtitleText: {
    marginRight: 5,
    flex: 1,
    color: Colors.greyText,
    fontSize: 13,
  },
});
