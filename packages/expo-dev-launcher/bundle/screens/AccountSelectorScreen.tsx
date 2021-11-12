import { XIcon } from '@expo/styleguide-native';
import * as React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../components/redesign/Button';
import { Heading, Text } from '../components/redesign/Text';
import { Row, Spacer, View } from '../components/redesign/View';

export function AccountSelectorScreen(props: any) {
  return (
    <SafeAreaView>
      <View padding="medium">
        <Row>
          <Heading size="medium">Account</Heading>
          <Spacer.Horizontal size="flex" />
          <Button>
            <XIcon />
          </Button>
        </Row>

        <Spacer.Vertical size="medium" />

        <View px="small" py="medium" bg="default" rounded="large">
          <Text color="secondary" size="small" leading="large">
            Log in or create an account to view local development servers and more.
          </Text>

          <Spacer.Vertical size="medium" />

          <Button bg="tertiary" py="small" rounded="medium">
            <Text button="tertiary" weight="semibold" align="center">
              Log In
            </Text>
          </Button>

          <Spacer.Vertical size="small" />

          <Button bg="secondary" py="small" rounded="medium">
            <Text button="secondary" weight="semibold" align="center">
              Sign up
            </Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
