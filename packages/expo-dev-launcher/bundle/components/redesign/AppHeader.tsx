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
      <Row align="center">
        <Row px="medium">
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

        <Button.ScaleOnPressContainer
          onPress={onUserProfilePress}
          minScale={0.85}
          accessibilityLabel="Navigate to User Profile"
          bg="default"
          rounded="full">
          <View rounded="full" padding="medium">
            {isAuthenticated ? (
              <View bg="secondary" rounded="full">
                <Image size="xl" rounded="full" source={{ uri: selectedUserImage }} />
              </View>
            ) : (
              <UserIcon />
            )}
          </View>
        </Button.ScaleOnPressContainer>
      </Row>

      <Divider weight="thin" />
    </View>
  );
}
