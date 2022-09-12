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
  const selectedUserImage = selectedAccount?.owner?.profilePhoto ?? null;

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
            <Button.ScaleOnPressContainer
              onPress={onUserProfilePress}
              minScale={0.85}
              accessibilityLabel="Navigate to User Profile"
              bg="ghost"
              rounded="full">
              <View>
                {isAuthenticated ? (
                  <View rounded="full" padding="small">
                    <View height="xl" width="xl" bg="secondary" rounded="full">
                      {selectedUserImage && (
                        <Image size="xl" rounded="full" source={{ uri: selectedUserImage }} />
                      )}
                    </View>
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
            {!selectedUserImage && (
              <Row
                style={{
                  height: scale[2],
                  flexWrap: 'wrap',
                  maxWidth: scale[16],
                  paddingRight: scale[2],
                  transform: [{ translateY: -scale[2] }],
                }}>
                <Text numberOfLines={1} size="small" align="center" weight="medium">
                  {selectedAccount?.name}
                </Text>
              </Row>
            )}
          </View>
        </Row>
      </View>
      <Divider weight="thin" />
    </>
  );
}
