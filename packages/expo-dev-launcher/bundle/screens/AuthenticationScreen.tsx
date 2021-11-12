import { XIcon } from '@expo/styleguide-native';
import * as React from 'react';

import { Button } from '../components/redesign/Button';
import { Heading, Text } from '../components/redesign/Text';
import { Row, Spacer, View } from '../components/redesign/View';
import { openAuthSessionAsync } from '../functions/openAuthSessionAsync';

export function AuthenticationScreen({ navigation }) {
  async function onLoginPress() {
    const result = await openAuthSessionAsync('login');
    console.log({ result });
  }

  async function onSignupPress() {
    const result = await openAuthSessionAsync('signup');
    console.log({ result });
  }

  function onClosePress() {
    navigation.goBack();
  }

  return (
    <View py="medium">
      <View padding="medium">
        <Row>
          <Heading size="medium">Account</Heading>
          <Spacer.Horizontal size="flex" />
          <Button onPress={onClosePress}>
            <XIcon />
          </Button>
        </Row>

        <Spacer.Vertical size="medium" />

        <View px="small" py="medium" bg="default" rounded="large">
          <Text color="secondary" size="small" leading="large">
            Log in or create an account to view local development servers and more.
          </Text>

          <Spacer.Vertical size="medium" />

          <Button bg="tertiary" py="small" rounded="medium" onPress={onLoginPress}>
            <Text button="tertiary" weight="semibold" align="center">
              Log In
            </Text>
          </Button>

          <Spacer.Vertical size="small" />

          <Button bg="secondary" py="small" rounded="medium" onPress={onSignupPress}>
            <Text button="secondary" weight="semibold" align="center">
              Sign up
            </Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
