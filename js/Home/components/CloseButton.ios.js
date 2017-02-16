/* @flow */

import React from 'react';
import { withNavigation } from '@exponent/ex-navigation';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@exponent/vector-icons';

import Colors from '../constants/Colors';

@withNavigation
export default class CloseButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        onPress={this._handlePress}
        style={styles.buttonContainer}>
        <Ionicons name="ios-close-outline" size={32} color={Colors.tintColor} />
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    this.props.navigation.dismissModal();
  };
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 15,
    paddingTop: 2,
  },
});
