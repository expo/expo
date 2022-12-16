import { borderRadius } from '@expo/styleguide-native';
import { View, Text, Button, useExpoTheme, Spacer } from 'expo-dev-client-components';
import { isDevice } from 'expo-device';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity as TouchableOpacityRN } from 'react-native';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';

type Props = {
  onClose: () => void;
};

// When rendered inside bottom sheet, touchables from RN don't work on Android, but the ones from GH don't work on iOS.
const TouchableOpacity = Platform.OS === 'android' ? TouchableOpacityGH : TouchableOpacityRN;

const KEYBOARD_CODES: { [key: string]: string } = {
  ios: '^\u2318Z',
  android: '\u2318M on macOS or Ctrl+M on other platforms',
};

const ONBOARDING_MESSAGE = (() => {
  let fragment;
  if (isDevice) {
    if (Platform.OS === 'ios') {
      fragment =
        'you can shake your device or long press anywhere on the screen with three fingers';
    } else {
      fragment = 'you can shake your device';
    }
  } else {
    fragment = `in a simulator you can press ${KEYBOARD_CODES[Platform.OS]}`;
  }
  return `Since this is your first time opening Expo Go, we wanted to show you this menu and let you know that ${fragment} to get back to it at any time.`;
})();

export function DevMenuOnboarding({ onClose }: Props) {
  const theme = useExpoTheme();

  return (
    <View style={styles.onboardingContainer}>
      <View style={styles.onboardingBackground} bg="default" />
      <View style={styles.onboardingTopMargin} />
      <View>
        <Text type="InterBold" align="center" size="large">
          Hello there, friend! 👋
        </Text>
        <Spacer.Vertical size="small" />
        <Text type="InterRegular" align="center" style={styles.onboardingTooltip}>
          {ONBOARDING_MESSAGE}
        </Text>
        <Spacer.Vertical size="medium" />
        <TouchableOpacity
          style={[styles.onboardingButton, { backgroundColor: theme.button.primary.background }]}
          onPress={onClose}>
          <Button.Text type="InterSemiBold" color="primary">
            Got it
          </Button.Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    paddingHorizontal: 36,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  onboardingBackground: {
    borderTopLeftRadius: borderRadius.large,
    borderTopRightRadius: borderRadius.large,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.9,
  },
  onboardingTopMargin: {
    // Moves the actual onboarding content a little bit down.
    // This percentage value is also a percentage of screen's height.
    height: '20%',
  },
  onboardingTooltip: {
    lineHeight: 20,
    textAlign: 'center',
  },
  onboardingButton: {
    alignItems: 'center',
    marginVertical: 12,
    paddingVertical: 12,
    borderRadius: 4,
  },
});
