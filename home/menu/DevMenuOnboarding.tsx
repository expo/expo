import { View, Text, Button, Spacer } from 'expo-dev-client-components';
import { isDevice } from 'expo-device';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';

type Props = {
  onClose: () => void;
};

const deviceMessage = Platform.select({
  ios: `You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.`,
  android: `You can shake your device to get back to it at any time.`,
});

const simulatorMessage = Platform.select({
  ios: (
    <Text size="medium">
      You can open it at any time with the <Text weight="bold">{'\u2318 + d '}</Text> keyboard
      shortcut{' '}
      <Text color="secondary" size="medium">
        ("Connect Hardware Keyboard" must be enabled on your simulator to use this shortcut, you can
        toggle it with{' '}
        <Text weight="bold" color="secondary" size="medium">
          {'\u2318 + shift + K'}
        </Text>
        ).
      </Text>
    </Text>
  ),
  android: (
    <Text size="medium">
      You can press{' '}
      <Text size="medium" weight="bold">
        {'\u2318 + m'}
      </Text>{' '}
      on macOS or{' '}
      <Text size="medium" weight="bold">
        Ctrl + m
      </Text>{' '}
      on other platforms to get back to it at any time.
    </Text>
  ),
});

export function DevMenuOnboarding({ onClose }: Props) {
  return (
    <View style={styles.onboardingContainer}>
      <View flex="1" bg="default" py="medium" px="large">
        <View>
          <Text size="medium" maxFontSizeMultiplier={1.2}>
            This is the developer menu. It gives you access to useful tools in Expo Go.
          </Text>
          <Spacer.Vertical size="medium" />
          <Text size="medium" maxFontSizeMultiplier={1.2}>
            {isDevice ? deviceMessage : simulatorMessage}
          </Text>
        </View>

        <Spacer.Vertical size="large" />

        <Button.FadeOnPressContainer bg="primary" onPress={onClose}>
          <View py="small">
            <Button.Text align="center" size="medium" color="primary" weight="medium">
              Continue
            </Button.Text>
          </View>
        </Button.FadeOnPressContainer>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
});
