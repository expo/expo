import { borderRadius, iconSize, spacing, UsersIcon } from '@expo/styleguide-native';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Button, View, Row, Image, Text } from 'expo-dev-client-components';
import * as Haptics from 'expo-haptics';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { HomeScreenDataQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { useTheme } from '../../utils/useTheme';

type Props = {
  currentAccount?: Exclude<HomeScreenDataQuery['account']['byName'], null>;
};

export function HomeScreenHeader({ currentAccount }: Props) {
  const { theme, themeType } = useTheme();
  const navigation = useNavigation<NavigationProp<HomeStackRoutes>>();

  async function onAccountButtonPress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Account');
  }

  let rightContent: React.ReactNode | null = null;

  if (currentAccount) {
    rightContent = (
      <Button.Container onPress={onAccountButtonPress}>
        {/* Show profile picture for personal accounts / accounts with members */}
        {currentAccount?.ownerUserActor?.profilePhoto ? (
          <Image
            size="xl"
            rounded="full"
            source={{ uri: currentAccount.ownerUserActor.profilePhoto }}
          />
        ) : (
          <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
            <UsersIcon color={theme.icon.default} size={iconSize.small} />
          </View>
        )}
      </Button.Container>
    );
  } else {
    // when user is logged out, show log in button
    rightContent = (
      <TouchableOpacity
        onPress={onAccountButtonPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          borderRadius: borderRadius.small,
          padding: spacing[2],
          backgroundColor: theme.button.ghost.background,
          borderWidth: 1,
          borderColor: theme.button.ghost.border,
        }}>
        <Button.Text type="InterSemiBold" color="ghost" size="small">
          Log In
        </Button.Text>
      </TouchableOpacity>
    );
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
            source={require('../../assets/client-logo.png')}
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
      {rightContent}
    </Row>
  );
}
