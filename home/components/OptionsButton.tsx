import { connectActionSheet } from '@expo/react-native-action-sheet';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Platform, StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';

function OptionsButton({ showActionSheetWithOptions }: any) {
  const handlePress = () => {
    const options = ['Report this user', 'Cancel'];
    const cancelButtonIndex = 1;
    showActionSheetWithOptions(
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

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <Ionicons
        name={Platform.select({ ios: 'ios-more', default: 'md-more' })}
        size={27}
        color={Colors.light.tintColor}
      />
    </TouchableOpacity>
  );
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
