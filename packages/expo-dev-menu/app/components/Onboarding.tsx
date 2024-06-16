import { View, Text, Spacer, Button } from 'expo-dev-client-components';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useMenuPreferences } from '../hooks/useMenuPreferences';

const deviceMessage = Platform.select({
  ios: `You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.`,
  android: `You can shake your device or long press anywhere on the screen with three fingers to get back to it at any time.`,
});

const simulatorMessage = Platform.select({
  ios: (
    <Text size="medium">
      You can open it at any time with the <Text weight="bold">{'\u2303 + d '}</Text> keyboard
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

type OnboardingProps = {
  isDevice?: boolean;
};

export function Onboarding({ isDevice }: OnboardingProps) {
  const { isOnboardingFinished, actions } = useMenuPreferences();
  const [isVisible, setIsVisible] = React.useState(!isOnboardingFinished);

  function onOnboardingFinishedPress() {
    actions.setOnboardingFinishedAsync(true);
    setIsVisible(false);
  }

  if (isVisible) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <View flex="1" bg="default" py="medium" px="large">
          <View>
            <Text size="medium" maxFontSizeMultiplier={1.2}>
              This is the developer menu. It gives you access to useful tools in your development
              builds.
            </Text>

            <Spacer.Vertical size="medium" />
            <Text size="medium" maxFontSizeMultiplier={1.2}>
              {isDevice ? deviceMessage : simulatorMessage}
            </Text>
          </View>

          <Spacer.Vertical size="large" />

          <Button.FadeOnPressContainer bg="primary" onPress={onOnboardingFinishedPress}>
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
  return <></>;
}
