import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

import Colors from '../constants/Colors';
import { Ionicons } from './Icons';

const slop = Platform.select({ ios: 15, default: 10 });

function CloseButton(props: Partial<React.ComponentProps<typeof TouchableOpacity>>) {
  const navigation = useNavigation();

  const handlePress = () => {
    navigation.goBack();
  };

  return (
    <TouchableOpacity
      hitSlop={{ top: slop, left: slop, right: slop, bottom: slop }}
      onPress={handlePress}
      style={[styles.buttonContainer, props.style]}>
      <Ionicons
        name={Platform.select({ ios: 'ios-close', default: 'md-close' })}
        size={Platform.select({ ios: 40, default: 28 })}
        lightColor={Colors.light.tintColor}
        darkColor={Colors.dark.tintColor}
      />
    </TouchableOpacity>
  );
}

export default CloseButton;

const styles = StyleSheet.create({
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: Platform.select({ ios: 15, default: 22 }),
    paddingTop: 3,
  },
});
