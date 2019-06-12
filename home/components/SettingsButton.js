/* @flow */
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { withNavigation } from 'react-navigation';

@withNavigation
export default class SettingsButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
        onPress={this._handlePress}
        style={styles.buttonContainer}>
        <MaterialIcons name="settings" size={28} color={'black'} />
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    this.props.navigation.navigate('UserSettings');
  };
}

const styles = StyleSheet.create({
  buttonContainer: {},
});
