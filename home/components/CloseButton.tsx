import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { withNavigation } from 'react-navigation';

import Colors from '../constants/Colors';
import { Ionicons } from './Icons';

const slop = Platform.select({ ios: 15, default: 10 });

function CloseButton({ navigation }) {
  const handlePress = () => {
    navigation.goBack(null);
  };

  return (
    <TouchableOpacity
      hitSlop={{ top: slop, left: slop, right: slop, bottom: slop }}
      onPress={handlePress}
      style={styles.buttonContainer}>
      <Ionicons
        name={Platform.select({ ios: 'ios-close', default: 'md-close' })}
        size={Platform.select({ ios: 40, default: 28 })}
        lightColor={Colors.light.tintColor}
        darkColor={Colors.dark.tintColor}
      />
    </TouchableOpacity>
  );
}

export default withNavigation(CloseButton);

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Platform.select({ ios: 15, default: 22 }),
    paddingTop: 3,
  },
});
