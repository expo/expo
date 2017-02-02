import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Ionicons,
} from '@exponent/vector-icons';

import Colors from '../constants/Colors';

import { withNavigation } from '@exponent/ex-navigation';
import { connectActionSheet } from '@exponent/react-native-action-sheet';
import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';

@connectActionSheet
@withNavigation
export default class AddProjectButton extends React.Component {
  render() {
    return (
      <TouchableOpacity
        style={styles.buttonContainer}
        onPress={this._handlePress}>
        <Ionicons size={37} name="ios-add" color={Colors.tintColor} />
      </TouchableOpacity>
    );
  }

  _handlePress = () => {
    let options = ['Scan QR Code', 'Open from Clipboard', 'Cancel'];
    let cancelButtonIndex = 2;
    this.props.showActionSheetWithOptions({
      options,
      cancelButtonIndex,
    },
    async (buttonIndex) => {
      if (buttonIndex === 0) {
        if (await requestCameraPermissionsAsync()) {
          this.props.navigation.showModal('qrCode');
        } else {
          alert('In order to use the QR Code scanner you need to provide camera permissions');
        }
      } else {
        // Do something
      }
    });
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});

