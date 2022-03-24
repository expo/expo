import { CheckIcon, iconSize, spacing, UsersIcon } from '@expo/styleguide-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, Image, useExpoTheme, Row, Spacer, Divider } from 'expo-dev-client-components';
import React from 'react';
import { ActivityIndicator, FlatList, Platform } from 'react-native';
import { useDispatch, useSelector } from 'redux/Hooks';
import SessionActions from 'redux/SessionActions';
import isUserAuthenticated from 'utils/isUserAuthenticated';

import { PressableOpacity } from '../../components/PressableOpacity';
import { useHome_CurrentUserQuery } from '../../graphql/types';
import { useAccountName } from '../../utils/AccountNameContext';
import { LoggedOutAccountView } from './LoggedOutAccountView';
import { ModalHeader } from './ModalHeader';

export function AccountModal() {
  const { accountName, setAccountName } = useAccountName();
  const theme = useExpoTheme();

  const { data, loading, error, refetch } = useHome_CurrentUserQuery();

  const { isAuthenticated } = useSelector((data) => {
    const isAuthenticated = isUserAuthenticated(data.session);
    return {
      isAuthenticated,
    };
  });
  const dispatch = useDispatch();

  const onSignOutPress = React.useCallback(() => {
    dispatch(SessionActions.signOut());
  }, [dispatch]);

  if (isAuthenticated && !data?.viewer) refetch(); // get accounts info after logging in

  if (loading) {
    return (
      <View flex="1">
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
      <View flex="1">
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
            <PressableOpacity
              onPress={() => refetch()}
              containerProps={{
                style: {
                  padding: spacing[2],
                  alignSelf: 'flex-start',
                  backgroundColor: theme.button.tertiary.background,
                },
                rounded: 'small',
              }}>
              <Text
                type="InterSemiBold"
                style={{ color: theme.button.tertiary.foreground }}
                size="small">
                Try again
              </Text>
            </PressableOpacity>
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
        <View flex="1" padding="medium">
          <View bg="default" border="hairline" overflow="hidden" rounded="large">
            <FlatList<typeof data.viewer.accounts[number]>
              data={data.viewer.accounts}
              keyExtractor={(account) => account.id}
              renderItem={({ item: account }) => (
                <PressableOpacity
                  key={account.id}
                  containerProps={{ bg: 'default', style: { padding: 16 } }}
                  onPress={() => {
                    setAccountName(account.name);
                  }}>
                  <Row justify="between">
                    <Row align={!account.owner?.fullName ? 'center' : 'start'}>
                      {account?.owner?.profilePhoto ? (
                        <Image
                          size="xl"
                          rounded="full"
                          source={{ uri: account.owner.profilePhoto }}
                        />
                      ) : (
                        <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
                          <UsersIcon color={theme.icon.default} size={iconSize.small} />
                        </View>
                      )}
                      <Spacer.Horizontal size="small" />
                      <View>
                        {account.owner ? (
                          <>
                            {account.owner.fullName ? (
                              <>
                                <Text type="InterBold">{account.owner.fullName}</Text>
                                <Spacer.Vertical size="tiny" />
                                <Text color="secondary" size="small">
                                  {account.owner.username}
                                </Text>
                              </>
                            ) : (
                              <Text type="InterBold">{account.owner.username}</Text>
                            )}
                          </>
                        ) : (
                          <Text type="InterBold">{account.name}</Text>
                        )}
                      </View>
                    </Row>
                    {accountName === account.name && (
                      <CheckIcon color={theme.icon.default} size={iconSize.large} />
                    )}
                  </Row>
                </PressableOpacity>
              )}
              ItemSeparatorComponent={Divider}
            />
          </View>
          <Spacer.Vertical size="small" />
          <View bg="default" overflow="hidden" rounded="large" border="hairline">
            <PressableOpacity onPress={onSignOutPress} containerProps={{ bg: 'default' }}>
              <View padding="medium">
                <Text size="medium">Sign out</Text>
              </View>
            </PressableOpacity>
          </View>
        </View>
      ) : (
        <LoggedOutAccountView />
      )}
    </View>
  );
}
