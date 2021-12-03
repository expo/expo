import {
  Button,
  Image,
  Heading,
  Text,
  Divider,
  Row,
  Spacer,
  View,
  UserIcon,
} from 'expo-dev-client-components';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '../../hooks/useUser';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  appImageUri?: string;
  onUserProfilePress: () => void;
};

export function AppHeader({ title, subtitle, appImageUri, onUserProfilePress }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { userData, selectedAccount } = useUser();

  const isAuthenticated = userData != null;
  const selectedUserImage = selectedAccount?.owner.profilePhoto;

  return (
    <View>
      <Spacer.Horizontal style={{ height: insets.top }} />
      <Row px="medium" py="small" align="center">
        <Row>
          {Boolean(appImageUri) && (
            <>
              <Image size="xl" rounded="medium" source={{ uri: appImageUri }} />
              <Spacer.Horizontal size="small" />
            </>
          )}

          <View>
            <Heading size="small" weight="semibold">
              {title}
            </Heading>
            <Text size="small" color="secondary">
              {subtitle}
            </Text>
          </View>
        </Row>

        <Spacer.Horizontal size="flex" />

        <Button onPress={onUserProfilePress} accessibilityLabel="Navigate to User Profile">
          <View rounded="full">
            {isAuthenticated ? (
              <View bg="secondary">
                <Image size="large" rounded="full" source={{ uri: selectedUserImage }} />
              </View>
            ) : (
              <UserIcon />
            )}
          </View>
        </Button>
      </Row>

      <Divider weight="thin" />
    </View>
  );
}
