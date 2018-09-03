/* @flow */

import React from 'react';
import { withNavigation } from 'react-navigation';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';

@withNavigation
export default class CloseButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        hitSlop={{ top: 15, left: 15, right: 15, bottom: 15 }}
        onPress={this._handlePress}
        style={styles.buttonContainer}>
        <Ionicons name="ios-close" size={40} color={Colors.tintColor} />
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    this.props.navigation.goBack(null);
  };
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 15,
    paddingTop: 3,
  },
});
