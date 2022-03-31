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

import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useUser } from '../providers/UserContextProvider';

export function AppHeader({ navigation }) {
  const buildInfo = useBuildInfo();
  const { appName, appIcon } = buildInfo;

  const { userData, selectedAccount } = useUser();

  const onUserProfilePress = () => {
    navigation.navigate('User Profile');
  };

  const isAuthenticated = userData != null;
  const selectedUserImage = selectedAccount?.owner?.profilePhoto;

  return (
    <View bg="default">
      <Row align="center" pb="small">
        <Spacer.Horizontal size="medium" />
        <View flex="1" shrink="1">
          <Row align="center">
            {Boolean(appIcon) && (
              <>
                <Image size="xl" rounded="large" source={{ uri: appIcon }} />
                <Spacer.Horizontal size="small" />
              </>
            )}

            <View flex="1">
              <Heading weight="semibold" numberOfLines={1}>
                {appName}
              </Heading>
              <Text size="small" color="secondary">
                Development Build
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
