import { UserIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import * as React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from './Button';
import { Image } from './Image';
import { Heading, Text } from './Text';
import { Divider, Row, Spacer, View } from './View';

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  appImageUri?: string;
  userImageUri?: string;
};

export function AppHeader({ title, subtitle, appImageUri, userImageUri }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const isLoggedIn = userImageUri != null;

  const onUserProfilePress = () => {
    navigation.navigate(isLoggedIn ? 'Select Account' : 'Authentication');
  };

  return (
    <View>
      <Spacer.Horizontal style={{ height: insets.top }} />
      <Row px="medium" py="small" align="center">
        <Row>
          <View width="large" height="large" bg="secondary" rounded="medium">
            <Image size="large" rounded="medium" source={{ uri: appImageUri }} />
          </View>

          <Spacer.Horizontal size="small" />

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

        <Button onPress={onUserProfilePress}>
          <View width="large" height="large" bg="secondary" rounded="full">
            {isLoggedIn ? (
              <Image size="large" rounded="full" source={{ uri: userImageUri }} />
            ) : (
              <UserIcon />
            )}
          </View>
        </Button>
      </Row>

      <Divider />
    </View>
  );
}
