/* @flow */
import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';

class OptionsButton extends React.Component {
  render() {
    return (
      <TouchableOpacity style={styles.container} onPress={this._handlePress}>
        <Ionicons
          name={Platform.select({ ios: 'ios-more', default: 'md-more' })}
          size={27}
          color="#4E9BDE"
        />
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    const options = ['Report this user', 'Cancel'];
    const cancelButtonIndex = 1;
    this.props.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      async buttonIndex => {
        if (buttonIndex === 0) {
          Alert.alert(
            'Thank you for your report',
            'We will investigate the case as soon as we can.'
          );
        }
      }
    );
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});

export default connectActionSheet(OptionsButton);
