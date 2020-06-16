/* @flow */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';

@withNavigation
export default class CloseButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        onPress={this._handlePress}
        style={styles.buttonContainer}>
        <Ionicons name="md-close" size={28} color={Colors.light.tintColor} />
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
    paddingLeft: 22,
    paddingTop: 3,
  },
});
