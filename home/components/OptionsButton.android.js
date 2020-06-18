/* @flow */
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import {
  Alert,
  findNodeHandle,
  NativeModules,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

export default class OptionsButton extends React.Component {
  _anchor: View;

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
          <MaterialIcons name="more-vert" size={27} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  _handlePress = () => {
    const handle = findNodeHandle(this._anchor);
    NativeModules.UIManager.showPopupMenu(
      handle,
      ['Report this user'],
      () => {},
      (action, selectedIndex) => {
        if (selectedIndex === 0) {
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
  loadingContainer: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
