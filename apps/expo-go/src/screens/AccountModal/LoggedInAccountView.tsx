import { borderRadius, CheckIcon, iconSize, spacing, UsersIcon } from '@expo/styleguide-native';
import { useNavigation } from '@react-navigation/native';
import { Text, View, Image, useExpoTheme, Row, Spacer, Divider } from 'expo-dev-client-components';
import React from 'react';
import { FlatList } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

import { SectionHeader } from '../../components/SectionHeader';
import { Home_CurrentUserActorQuery } from '../../graphql/types';
import { useDispatch } from '../../redux/Hooks';
import SessionActions from '../../redux/SessionActions';
import { useAccountName } from '../../utils/AccountNameContext';

type Props = {
  accounts: Exclude<Home_CurrentUserActorQuery['meUserActor'], undefined | null>['accounts'];
};

export function LoggedInAccountView({ accounts }: Props) {
  const { accountName, setAccountName } = useAccountName();
  const navigation = useNavigation();
  const theme = useExpoTheme();
  const dispatch = useDispatch();

  const onSignOutPress = React.useCallback(() => {
    setAccountName(undefined);
    dispatch(SessionActions.signOut());
  }, [dispatch]);

  return (
    <View flex="1">
      <View flex="1">
        <FlatList<(typeof accounts)[number]>
          data={accounts}
          contentContainerStyle={{ padding: spacing[4] }}
          ListHeaderComponent={() => (
            <>
              <SectionHeader header="Log Out" style={{ paddingTop: 0 }} />
              <TouchableOpacity
                onPress={onSignOutPress}
                style={{
                  backgroundColor: theme.button.tertiary.background,
                  padding: spacing[3],
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: borderRadius.medium,
                }}>
                <Text style={{ color: theme.button.tertiary.foreground }} type="InterSemiBold">
                  Log Out
                </Text>
              </TouchableOpacity>
              <Spacer.Vertical size="large" />
              <SectionHeader header="Switch Account" style={{ paddingTop: 0 }} />
            </>
          )}
          keyExtractor={(account) => account.id}
          renderItem={({ item: account, index }) => (
            <TouchableOpacity
              key={account.id}
              onPress={() => {
                setAccountName(account.name);
                navigation.goBack();
              }}>
              <Row
                justify="between"
                padding="medium"
                align="center"
                bg="default"
                border="default"
                roundedTop={index === 0 ? 'large' : undefined}
                roundedBottom={index === accounts.length - 1 ? 'large' : undefined}
                style={{
                  borderBottomWidth: index === accounts.length - 1 ? 1 : 0,
                  borderTopWidth: index === 0 ? 1 : 0,
                }}>
                <Row flex="1" align={!account.ownerUserActor?.fullName ? 'center' : 'start'}>
                  {account?.ownerUserActor?.profilePhoto ? (
                    <Image
                      size="xl"
                      rounded="full"
                      source={{ uri: account.ownerUserActor.profilePhoto }}
                    />
                  ) : (
                    <View rounded="full" height="xl" width="xl" bg="secondary" align="centered">
                      <UsersIcon color={theme.icon.default} size={iconSize.small} />
                    </View>
                  )}
                  <Spacer.Horizontal size="small" />
                  <View flex="1">
                    {account.ownerUserActor ? (
                      <>
                        {account.ownerUserActor.fullName ? (
                          <>
                            <Text
                              type="InterSemiBold"
                              style={{ paddingRight: spacing[4] }}
                              numberOfLines={1}>
                              {account.ownerUserActor.fullName}
                            </Text>
                            <Spacer.Vertical size="tiny" />
                            <Text
                              style={{ paddingRight: spacing[4] }}
                              color="secondary"
                              type="InterRegular"
                              numberOfLines={1}
                              size="small">
                              {account.ownerUserActor.username}
                            </Text>
                          </>
                        ) : (
                          <Text
                            type="InterSemiBold"
                            style={{ paddingRight: spacing[4] }}
                            numberOfLines={1}>
                            {account.ownerUserActor.username}
                          </Text>
                        )}
                      </>
                    ) : (
                      <Text type="InterBold" style={{ paddingRight: spacing[4] }} numberOfLines={1}>
                        {account.name}
                      </Text>
                    )}
                  </View>
                </Row>
                {accountName === account.name && (
                  <CheckIcon color={theme.icon.default} size={iconSize.large} />
                )}
              </Row>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <Divider style={{ height: 1 }} />}
        />
      </View>
    </View>
  );
}
