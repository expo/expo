import { spacing } from '@expo/styleguide-native';
import Ionicons from '@expo/vector-icons/build/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Text, View, useExpoTheme, Row, Spacer } from 'expo-dev-client-components';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { useHome_CurrentUserQuery } from '../../graphql/types';
import { useSelector } from '../../redux/Hooks';
import isUserAuthenticated from '../../utils/isUserAuthenticated';
import { LoggedInAccountView } from './LoggedInAccountView';
import { LoggedOutAccountView } from './LoggedOutAccountView';
import { ModalHeader } from './ModalHeader';

export function AccountModal() {
  const theme = useExpoTheme();

  const { data, loading, error, refetch } = useHome_CurrentUserQuery();
  const navigation = useNavigation();
  const { isAuthenticated } = useSelector((data) => {
    const isAuthenticated = isUserAuthenticated(data.session);
    return {
      isAuthenticated,
    };
  });

  useEffect(() => {
    // wait for redux action to dispatch so other queries can be fetched
    if (isAuthenticated && !data?.viewer) {
      // get accounts info after logging in, then dismiss the modal
      refetch().then(() => {
        navigation.goBack();
      });
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <View flex="1" style={{ backgroundColor: theme.background.screen }}>
        {Platform.OS === 'ios' && <ModalHeader />}
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
                name={Platform.select({ ios: 'ios-warning', default: 'md-warning' })}
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
    <View flex="1">
      {Platform.OS === 'ios' && <ModalHeader />}
      {data?.viewer?.accounts ? (
        <LoggedInAccountView accounts={data.viewer.accounts} />
      ) : (
        <LoggedOutAccountView />
      )}
    </View>
  );
}
