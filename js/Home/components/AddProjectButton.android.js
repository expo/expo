import React from 'react';
import {
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
  findNodeHandle,
} from 'react-native';
import {
  MaterialIcons,
} from '@exponent/vector-icons';

import { withNavigation } from '@exponent/ex-navigation';

import Colors from '../constants/Colors';

@withNavigation
export default class AddProjectButton extends React.Component {
  render() {
    return (
      <View style={{flex: 1}}>
        <View
          collapsable={false}
          ref={view => { this._anchor = view; }}
          style={{position: 'absolute', top: 5, left: 0}}
        />
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={this._handlePress}>
          <MaterialIcons size={30} name="add" color={Colors.tintColor} />
        </TouchableOpacity>
      </View>
    );
  }

  _handlePress = () => {
    let options = ['Scan QR Code', 'Open from Clipboard'];
    let handle = findNodeHandle(this._anchor);
    NativeModules.UIManager.showPopupMenu(handle, options, (err) => {}, (action, selectedIndex) => {
      console.log({action, selectedIndex});
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

