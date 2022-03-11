import { Heading, View, Text, Spacer, Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useMenuPreferences } from '../hooks/useMenuPreferences';
import { GestureHandlerTouchableWrapper } from './GestureHandlerTouchableWrapper';

const deviceMessage = Platform.select({
  ios: `Since this is your first time opening Expo Go, we wanted to show you this menu and let you know that you can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.`,
  android: `Since this is your first time opening Expo Go, we wanted to show you this menu and let you know that you can shake your device to get back to it at any time.`,
});

const simulatorMessage = Platform.select({
  ios: `Since this is your first time opening Expo Go, we wanted to show you this menu and let you know that in a simulator you can press \u2318D (make sure that 'I/O \u279E Send Keyboard Input to Device' is enabled on your simulator) to get back to it at any time.`,
  android: `Since this is your first time opening Expo Go, we wanted to show you this menu and let you know thatin a simulator you can press \u2318M on macOS or Ctrl+M on other platforms to get back to it at any time.`,
});

type OnboardingProps = {
  isSimulator?: boolean;
};

export function Onboarding({ isSimulator }: OnboardingProps) {
  const { isOnboardingFinished, actions } = useMenuPreferences();
  const [isVisible, setIsVisible] = React.useState(!isOnboardingFinished);

  function onOnboardingFinishedPress() {
    actions.setOnboardingFinishedAsync(true);
    setIsVisible(false);
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {isVisible && (
        <View style={StyleSheet.absoluteFill}>
          <View flex="1" bg="default" py="large" px="large">
            <Heading size="large" weight="bold">
              Hello there, friend! 👋
            </Heading>

            <Spacer.Vertical size="medium" />

            <View>
              <Text size="large" weight="medium">
                {isSimulator ? simulatorMessage : deviceMessage}
              </Text>

              <Spacer.Vertical size="medium" />
              <Text size="large" weight="medium">
                Also, this menu is only available in development builds and won't be in any release
                builds.
              </Text>
            </View>

            <Spacer.Vertical size="xl" />

            <GestureHandlerTouchableWrapper onPress={onOnboardingFinishedPress}>
              <Button.ScaleOnPressContainer bg="primary" onPress={onOnboardingFinishedPress}>
                <View py="small">
                  <Button.Text align="center" size="large" color="primary" weight="medium">
                    Got It
                  </Button.Text>
                </View>
              </Button.ScaleOnPressContainer>
            </GestureHandlerTouchableWrapper>
          </View>
        </View>
      )}
    </View>
  );
}
