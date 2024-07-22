import { spacing } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { Text, View, useExpoTheme, Row, Spacer } from 'expo-dev-client-components';
import React from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { LoggedInAccountView } from './LoggedInAccountView';
import { LoggedOutAccountView } from './LoggedOutAccountView';
import { ModalHeader } from './ModalHeader';
import { useHome_CurrentUserActorQuery } from '../../graphql/types';

export function AccountModal() {
  const theme = useExpoTheme();

  const { data, loading, error, refetch } = useHome_CurrentUserActorQuery({
    fetchPolicy: 'cache-and-network',
  });

  if (loading) {
    return (
      <View flex="1" style={{ backgroundColor: theme.background.screen }}>
        <ModalHeader />
        <View flex="1" padding="medium" align="centered">
          <ActivityIndicator color={theme.highlight.accent} />
        </View>
      </View>
    );
  }

  if (error) {
    console.error(error);

    return (
      <View flex="1" style={{ backgroundColor: theme.background.screen }}>
        {Platform.OS === 'ios' && <ModalHeader />}
        <View padding="medium">
          <View
            bg="warning"
            rounded="medium"
            padding="medium"
            style={{ borderWidth: 1, borderColor: theme.border.warning }}>
            <Row align="center">
              <Ionicons
                name="warning"
                size={18}
                lightColor={theme.text.warning}
                darkColor={theme.text.warning}
                style={{
                  marginRight: 4,
                }}
              />
              <Text color="warning" type="InterSemiBold">
                We couldn't load your accounts.
              </Text>
            </Row>
            <Spacer.Vertical size="small" />
            <Text color="warning" type="InterRegular">
              {error.message}
            </Text>
            <Spacer.Vertical size="small" />
            <TouchableOpacity onPress={() => refetch()}>
              <View
                style={{
                  padding: spacing[2],
                  alignSelf: 'flex-start',
                  backgroundColor: theme.button.tertiary.background,
                }}
                rounded="small">
                <Text
                  type="InterSemiBold"
                  style={{ color: theme.button.tertiary.foreground }}
                  size="small">
                  Try again
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // if data.viewer is undefined, then the user is not authenticated, so show the login screen

  return (
    <View flex="1" style={{ backgroundColor: theme.background.screen }}>
      <ModalHeader />
      {data?.meUserActor?.accounts ? (
        <LoggedInAccountView accounts={data.meUserActor.accounts} />
      ) : (
        <LoggedOutAccountView
          refetch={async () => {
            await refetch();
          }}
        />
      )}
    </View>
  );
}
