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
  scale,
} from 'expo-dev-client-components';
import * as React from 'react';
import { useWindowDimensions } from 'react-native';

import { Avatar } from './Avatar';
import { SafeAreaTop } from '../components/SafeAreaTop';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { useUser } from '../providers/UserContextProvider';

export function AppHeader({ navigation }) {
  const buildInfo = useBuildInfo();
  const { width } = useWindowDimensions();
  const { appName, appIcon } = buildInfo;

  const { userData, selectedAccount } = useUser();

  const onUserProfilePress = () => {
    navigation.navigate('User Profile');
  };

  const isAuthenticated = userData != null;
  const selectedUserImage = selectedAccount?.ownerUserActor?.profilePhoto ?? null;

  return (
    <>
      <View
        bg="default"
        pt="small"
        pb="small"
        style={{ paddingHorizontal: width > 650 ? scale[14] : 0 }}>
        <SafeAreaTop />
        <Row align="center">
          <Spacer.Horizontal size="medium" />
          <View flex="1" shrink="1">
            <Row align="center">
              <View height="xl" width="xl" rounded="large" bg="secondary">
                {Boolean(appIcon) && <Image size="xl" rounded="large" source={{ uri: appIcon }} />}
              </View>

              <Spacer.Horizontal size="small" />

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

          <View align="centered" style={{ justifyContent: 'flex-end' }}>
            <Button.HighlightOnPressContainer
              onPress={onUserProfilePress}
              accessibilityLabel="Navigate to User Profile"
              bg="ghost"
              rounded="full">
              <View>
                {isAuthenticated ? (
                  <View rounded="full" padding="small">
                    <Avatar
                      profilePhoto={selectedUserImage}
                      name={
                        selectedAccount?.ownerUserActor?.fullName
                          ? selectedAccount.ownerUserActor.fullName
                          : selectedAccount?.name
                      }
                      isOrganization={selectedAccount?.ownerUserActor === null}
                      size="xl"
                    />
                  </View>
                ) : (
                  <View mx="small">
                    <View bg="default" rounded="full" padding="tiny">
                      <UserIcon />
                    </View>
                  </View>
                )}
              </View>
            </Button.HighlightOnPressContainer>
          </View>
        </Row>
      </View>
      <Divider weight="thin" />
    </>
  );
}
