import { StackScreenProps } from '@react-navigation/stack';
import { ProfileData } from 'containers/Profile';
import dedent from 'dedent';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { AllStackRoutes } from '../navigation/Navigation.types';
import ListItem from './ListItem';
import ScrollView from './NavigationScrollView';
import PrimaryButton from './PrimaryButton';
import RefreshControl from './RefreshControl';
import SectionHeader from './SectionHeader';
import { StyledText } from './Text';
import { StyledView } from './Views';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

export type ProfileViewProps = StackScreenProps<AllStackRoutes, 'Profile'>;

type QueryProps = {
  loading: boolean;
  error?: Error;
  refetch: (props: any) => void;
  data?: ProfileData;
};

type Props = ProfileViewProps & QueryProps;

export default function ProfileView({ navigation, loading, error, refetch, data }: Props) {
  const [isRefreshing, setRefreshing] = React.useState(false);
  const mounted = React.useRef<boolean | null>(true);

  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  React.useEffect(() => {
    const SkipConnectionNotification = true;
    // NOTE(brentvatne): sorry for this
    if (!SkipConnectionNotification && error?.message.includes('No connection available')) {
      // Should have some integrated alert banner
      alert('No connection available');
    }
  }, [error]);

  const _handleRefreshAsync = async () => {
    if (isRefreshing) {
      return;
    }
    try {
      setRefreshing(true);
      refetch({ fetchPolicy: 'network-only' });
    } catch (e) {
      // TODO(brentvatne): Put this into Sentry
      console.log({ e });
    } finally {
      // Add a slight delay so it doesn't just disappear immediately,
      // this actually looks nicer because you might think that it
      // didn't work if it disappears too quickly
      setTimeout(() => {
        if (mounted.current) {
          setRefreshing(false);
        }
      }, 500);
    }
  };

  if (error) {
    return (
      <ProfileErrorView error={error} isRefetching={isRefreshing} onRefresh={_handleRefreshAsync} />
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={_handleRefreshAsync} />}
      contentContainerStyle={{ paddingBottom: 20 }}
      style={styles.container}>
      {data?.me && (
        <>
          <ProfileHeader data={data} />
          <ProfileAccountsSection data={data} navigation={navigation} />
        </>
      )}
    </ScrollView>
  );
}

function ProfileErrorView({
  error,
  isRefetching,
  onRefresh,
}: {
  error?: Error;
  isRefetching: boolean;
  onRefresh: () => void;
}) {
  // NOTE(brentvatne): sorry for this
  const isConnectionError = error?.message?.includes('No connection available');

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
      <StyledText
        style={SharedStyles.noticeDescriptionText}
        lightColor="rgba(36, 44, 58, 0.7)"
        darkColor="#ccc">
        {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
      </StyledText>

      <PrimaryButton plain onPress={onRefresh} fallback={TouchableOpacity}>
        Try again
      </PrimaryButton>

      {isRefetching && (
        <View style={{ marginTop: 20 }}>
          <ActivityIndicator color={Colors.light.tintColor} />
        </View>
      )}
    </ScrollView>
  );
}

function ProfileHeader({ data }: { data: NonNullable<Props['data']> }) {
  const { firstName, lastName, profilePhoto } = data.me;
  return (
    <StyledView style={styles.header} darkBackgroundColor="#000" darkBorderColor="#000">
      <View style={styles.headerAvatarContainer}>
        <FadeIn>
          <Image style={styles.headerAvatar} source={{ uri: profilePhoto }} />
        </FadeIn>
      </View>
      <StyledText style={styles.headerFullNameText}>
        {firstName} {lastName}
      </StyledText>
      <View style={styles.headerAccountsList}>
        <StyledText style={styles.headerAccountText} lightColor="#232B3A" darkColor="#ccc">
          @{data.me.username}
        </StyledText>
      </View>
    </StyledView>
  );
}

function ProfileAccountsSection({
  data,
  navigation,
}: Pick<Props, 'navigation'> & {
  data: NonNullable<Props['data']>;
}) {
  const onPressAccount = (accountName: string) => {
    navigation.navigate('Account', { accountName });
  };

  const renderAccount = (account: { id: string; name: string }) => {
    return (
      <ListItem
        key={account.id}
        title={`@${account.name}`}
        onPress={() => onPressAccount(account.name)}
      />
    );
  };

  const accounts = data.me.accounts;
  return (
    <View>
      <SectionHeader title="Accounts & Organizations" />
      {accounts.map(renderAccount)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: -1,
  },
  header: {
    alignItems: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  headerAvatarContainer: {
    marginTop: 20,
    marginBottom: 12,
    overflow: 'hidden',
    borderRadius: 5,
  },
  headerAvatar: {
    height: 64,
    width: 64,
    borderRadius: 5,
  },
  legacyHeaderAvatar: {
    backgroundColor: '#eee',
  },
  headerAccountsList: {
    paddingBottom: 20,
  },
  headerAccountText: {
    // color: 'rgba(36, 44, 58, 0.4)',
    fontSize: 14,
  },
  headerFullNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
});
