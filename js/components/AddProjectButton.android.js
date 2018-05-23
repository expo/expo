/* @flow */

import React from 'react';
import {
  Clipboard,
  Linking,
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
  findNodeHandle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { withNavigation } from 'react-navigation';

import ExUrls from 'ExUrls';
import Colors from '../constants/Colors';
import requestCameraPermissionsAsync from '../utils/requestCameraPermissionsAsync';

@withNavigation
export default class AddProjectButton extends React.Component {
  render() {
    return (
      <View style={{ flex: 1 }}>
        <View
          collapsable={false}
          ref={view => {
            this._anchor = view;
          }}
          style={{ position: 'absolute', top: 5, left: 0 }}
        />
        <TouchableOpacity style={styles.buttonContainer} onPress={this._handlePress}>
          <MaterialIcons size={30} name="add" color={Colors.tintColor} />
        </TouchableOpacity>
      </View>
    );
  }

  _handlePress = () => {
    let options = ['Scan QR Code', 'Open from Clipboard'];
    let handle = findNodeHandle(this._anchor);
    NativeModules.UIManager.showPopupMenu(
      handle,
      options,
      err => {},
      async (action, buttonIndex) => {
        if (buttonIndex === 0) {
          if (await requestCameraPermissionsAsync()) {
            this.props.navigation.navigate('QRCode');
          } else {
            alert('In order to use the QR Code scanner you need to provide camera permissions');
          }
        } else if (buttonIndex === 1) {
          let clipboardString = await Clipboard.getString();

          if (!clipboardString) {
            alert('Your clipboard is empty');
          } else {
            let url = ExUrls.normalizeUrl(clipboardString);
            Linking.canOpenURL(url) && Linking.openURL(url);
          }
        }
      }
    );
  };
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
