import * as React from 'react';
import { Alert, Linking, StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';
import * as UrlUtils from '../utils/UrlUtils';
import { Ionicons } from './Icons';

export default function OpenProjectByURLButton() {
  const _handlePress = () => {
    Alert.prompt('Enter a project URL to open it', 'Must be a valid Expo project', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open',
        onPress: (text) => {
          if (text) {
            const url = UrlUtils.normalizeUrl(text);
            Linking.openURL(url);
          }
        },
      },
    ]);
  };
  return (
    <TouchableOpacity style={styles.buttonContainer} onPress={_handlePress}>
      <Ionicons
        size={37}
        name="ios-add"
        lightColor={Colors.light.tintColor}
        darkColor={Colors.dark.tintColor}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 15,
  },
});
