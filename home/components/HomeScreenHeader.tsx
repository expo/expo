import { borderRadius, iconSize, spacing, UsersIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { Button, View, Row, Image, Text } from 'expo-dev-client-components';
import * as Haptics from 'expo-haptics';
import { HomeScreenDataQuery } from 'graphql/types';
import * as React from 'react';
import { Platform, StyleSheet } from 'react-native';

import { useTheme } from '../utils/useTheme';
import { PressableOpacity } from './PressableOpacity';

type Props = {
  currentUser?: Exclude<HomeScreenDataQuery['account']['byName'], null>;
};

export function HomeScreenHeader({ currentUser }: Props) {
  const { theme, themeType } = useTheme();

  const navigation = useNavigation();

  async function onAccountButtonPress() {
    try {
      if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error(e);
    }
    navigation.navigate('Account');
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
        <Text type="InterBold" color="default">
          Expo Go
        </Text>
      </Row>
      {!currentUser ? (
        <PressableOpacity
          borderRadius={borderRadius.small}
          onPress={onAccountButtonPress}
          containerProps={{
            style: {
              backgroundColor: theme.button.ghost.background,
              borderWidth: 1,
              borderColor: theme.button.ghost.border,
              padding: spacing[2],
            },
          }}>
          <Button.Text type="InterSemiBold" color="ghost" size="small">
            Log in
          </Button.Text>
        </PressableOpacity>
      ) : (
        <Button.Container onPress={onAccountButtonPress}>
          {/* Show profile picture for personal accounts / accounts with members */}
          {currentUser?.owner?.profilePhoto ? (
            <Image size="xl" rounded="full" source={{ uri: currentUser.owner.profilePhoto }} />
          ) : (
            <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
              {/* TODO: Show log in button when there is no session */}
              <UsersIcon color={theme.icon.default} size={iconSize.small} />
            </View>
          )}
        </Button.Container>
      )}
    </Row>
  );
}
