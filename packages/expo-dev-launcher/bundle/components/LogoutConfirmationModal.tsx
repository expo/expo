import { Button, Heading, Row, Spacer, View } from 'expo-dev-client-components';
import * as React from 'react';

import { BaseModal } from './BaseModal';

export function LogoutConfirmationModal({ onLogoutPress, onClosePress }) {
  return (
    <BaseModal title="Confirm logout">
      <Heading weight="medium">Are you sure you want to log out?</Heading>

      <Spacer.Vertical size="medium" />

      <Row>
        <View flex="1" grow="1">
          <Button.ScaleOnPressContainer
            bg="tertiary"
            rounded="medium"
            onPress={onLogoutPress}
            accessibilityLabel="Log out">
            <View padding="small" rounded="medium">
              <Button.Text color="tertiary" weight="bold" align="center">
                Log Out
              </Button.Text>
            </View>
          </Button.ScaleOnPressContainer>
        </View>

        <Spacer.Horizontal size="medium" />

        <View flex="1" grow="1">
          <Button.ScaleOnPressContainer
            bg="ghost"
            border="ghost"
            rounded="medium"
            onPress={onClosePress}>
            <View padding="small" rounded="medium">
              <Button.Text color="ghost" weight="bold" align="center">
                Nevermind
              </Button.Text>
            </View>
          </Button.ScaleOnPressContainer>
        </View>
      </Row>
    </BaseModal>
  );
}
