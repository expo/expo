import { spacing } from '@expo/styleguide-native';
import { Button, View, Row, Image, UserIcon, scale } from 'expo-dev-client-components';
import * as Haptics from 'expo-haptics';
import { CurrentUserDataFragment } from 'graphql/types';
import * as React from 'react';
import { Platform, Text } from 'react-native';

import { useStyleguideTheme } from '../utils/useTheme';

type Props = {
  currentUser?: CurrentUserDataFragment;
};

export function HomeScreenHeader({ currentUser }: Props) {
  const { theme, themeType } = useStyleguideTheme();

  return (
    <Row
      padding="medium"
      align="center"
      style={{
        justifyContent: 'space-between',
        backgroundColor: theme.background.default,
      }}>
      <Row align="center">
        <View
          align="centered"
          rounded="medium"
          style={{
            backgroundColor: theme.background.default,
            height: scale.xl,
            width: scale.xl,
            marginRight: spacing[2],
            ...(themeType === 'dark' && {
              borderColor: theme.border.default,
              backgroundColor: theme.background.overlay,
            }),
          }}
          shadow="button">
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
        {/* TODO: Dev Client Text component doesn't change color */}
        <Text
          style={{ color: theme.text.default, fontWeight: Platform.OS === 'ios' ? '600' : 'bold' }}>
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
          <Image size="xl" rounded="full" source={{ uri: currentUser?.profilePhoto }} />
        ) : (
          <View
            rounded="full"
            height="xl"
            width="xl"
            style={{ backgroundColor: theme.background.secondary }}
            align="centered">
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
