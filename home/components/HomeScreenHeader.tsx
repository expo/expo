import { spacing } from '@expo/styleguide-native';
import { Button, View, Row, Image, UserIcon, Text } from 'expo-dev-client-components';
import * as Haptics from 'expo-haptics';
import { CurrentUserDataFragment } from 'graphql/types';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useTheme } from '../utils/useTheme';

type Props = {
  currentUser?: CurrentUserDataFragment;
};

export function HomeScreenHeader({ currentUser }: Props) {
  const { theme, themeType } = useTheme();

  async function onAccountButtonPress() {
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error(e);
    }
    console.log('Show Account Modal');
  }

  return (
    <Row
      padding="medium"
      align="center"
      bg="default"
      justify="between"
      style={{
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.border.default,
      }}>
      <Row align="center">
        <View
          align="centered"
          rounded="medium"
          shadow="button"
          height="xl"
          width="xl"
          bg={themeType === 'dark' ? 'secondary' : 'default'}
          style={{
            marginRight: spacing[2],
            elevation: themeType === 'light' ? 1 : 0,
          }}>
          <Image
            size="xl"
            source={require('../assets/client-logo.png')}
            style={{
              tintColor: theme.text.default,
              width: 15.3,
              height: 17.19,
              resizeMode: 'contain',
            }}
          />
        </View>
        <Text color="default" weight="bold">
          Expo Go
        </Text>
      </Row>
      <Button.Container onPress={onAccountButtonPress}>
        {currentUser?.profilePhoto ? (
          <Image size="xl" rounded="full" source={{ uri: currentUser.profilePhoto }} />
        ) : (
          <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
            <UserIcon
              style={{
                tintColor: theme.icon.default,
              }}
              size="small"
            />
          </View>
        )}
      </Button.Container>
    </Row>
  );
}
