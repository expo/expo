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

import { useUser } from '../hooks/useUser';

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
  const selectedUserImage = selectedAccount?.owner?.profilePhoto;

  return (
    <View>
      <View style={{ height: insets.top }} />

      <Row align="center" pb="small">
        <Spacer.Horizontal size="medium" />
        <View flex="1" shrink="1">
          <Row align="center">
            {Boolean(appImageUri) && (
              <>
                <Image size="xl" rounded="large" source={{ uri: appImageUri }} />
                <Spacer.Horizontal size="small" />
              </>
            )}

            <View flex="1">
              <Heading weight="semibold" numberOfLines={1}>
                {title}
              </Heading>
              <Text size="small" color="secondary">
                {subtitle}
              </Text>
            </View>
          </Row>
        </View>

        <View>
          <Button.ScaleOnPressContainer
            onPress={onUserProfilePress}
            minScale={0.85}
            accessibilityLabel="Navigate to User Profile"
            bg="ghost"
            rounded="full">
            <View>
              {isAuthenticated ? (
                <View rounded="full" padding="small">
                  <Image size="xl" rounded="full" source={{ uri: selectedUserImage }} />
                </View>
              ) : (
                <View mx="small">
                  <View bg="default" rounded="full" padding="tiny">
                    <UserIcon />
                  </View>
                </View>
              )}
            </View>
          </Button.ScaleOnPressContainer>
        </View>
      </Row>

      <Divider weight="thin" />
    </View>
  );
}
