import { spacing } from '@expo/styleguide-native';
import { Button, View, Row, Image, UserIcon, scale, Text } from 'expo-dev-client-components';
import * as Haptics from 'expo-haptics';
import { CurrentUserDataFragment } from 'graphql/types';
import * as React from 'react';
import { Platform } from 'react-native';

import { useTheme } from '../utils/useTheme';

type Props = {
  currentUser?: CurrentUserDataFragment;
};

export function HomeScreenHeader({ currentUser }: Props) {
  const { theme, themeType } = useTheme();

  return (
    <Row
      padding="medium"
      align="center"
      bg="default"
      style={{
        justifyContent: 'space-between',
      }}>
      <Row align="center">
        <View
          align="centered"
          rounded="medium"
          shadow="button"
          style={{
            backgroundColor: theme.background.default,
            height: scale.xl,
            width: scale.xl,
            marginRight: spacing[2],
            ...(themeType === 'dark' && {
              borderColor: theme.border.default,
              backgroundColor: theme.background.overlay,
            }),
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
      <Button.Container
        onPress={async () => {
          try {
            if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          } catch (e) {
            console.error(e);
          }
          console.log('Show Account Modal');
        }}>
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
