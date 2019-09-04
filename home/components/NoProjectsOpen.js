/* @flow */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StyledView } from './Views';

import Colors from '../constants/Colors';

export default class NoProjectsOpen extends React.Component {
  render() {
    const { isAuthenticated } = this.props;
    let message;
    if (isAuthenticated) {
      message = 'No projects are currently open.';
    } else {
      message =
        'Sign in to your Expo account to see the projects you have recently been working on.';
    }

    return (
      <StyledView style={[styles.container, styles.bottomBorder]}>
        <View style={styles.infoContainer}>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitleText}>{message}</Text>
          </View>
        </View>
      </StyledView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flex: 1,
    marginBottom: 12,
  },
  bottomBorder: {
    flexGrow: 1,
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
  subtitleText: {
    marginRight: 5,
    flex: 1,
    color: Colors.light.greyText,
    fontSize: 13,
  },
});
