import { StackScreenProps } from '@react-navigation/stack';
import { Project } from 'components/ProjectList';
import dedent from 'dedent';
import { take, takeRight } from 'lodash';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { ProfileData } from '../containers/Profile';
import { AllStackRoutes } from '../navigation/Navigation.types';
import EmptyAccountProjectsNotice from './EmptyAccountProjectsNotice';
import EmptyAccountSnacksNotice from './EmptyAccountSnacksNotice';
import ListItem from './ListItem';
import ScrollView from './NavigationScrollView';
import PrimaryButton from './PrimaryButton';
import ProjectListItem from './ProjectListItem';
import RefreshControl from './RefreshControl';
import SectionHeader from './SectionHeader';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SnackListItem from './SnackListItem';
import { StyledText } from './Text';
import { StyledView } from './Views';

const MAX_APPS_TO_DISPLAY = 3;
const MAX_SNACKS_TO_DISPLAY = 3;

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
          <ProfileProjectsSection data={data} navigation={navigation} />
          <ProfileSnacksSection data={data} navigation={navigation} />
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
      <View style={styles.headerAccountName}>
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

  const accounts = data.me.accounts;
  if (accounts.length === 1) {
    return null;
  }

  const renderAccount = (account: { id: string; name: string }, index: number) => {
    return (
      <ListItem
        key={account.id}
        title={`@${account.name}`}
        onPress={() => onPressAccount(account.name)}
        last={index === accounts.length - 1}
      />
    );
  };

  return (
    <View>
      <SectionHeader title="Accounts & Organizations" />
      {accounts.map(renderAccount)}
    </View>
  );
}

function ProfileProjectsSection({
  data,
  navigation,
}: Pick<Props, 'navigation'> & {
  data: NonNullable<Props['data']>;
}) {
  const onPressProjectList = () => {
    navigation.navigate('ProfileAllProjects', {});
  };

  const renderApp = (app: Project, i: number) => {
    return (
      <ProjectListItem
        key={i}
        url={app.fullName}
        unlisted={app.privacy === 'unlisted'}
        image={app.iconUrl || require('../assets/placeholder-app-icon.png')}
        title={app.name}
        sdkVersion={app.sdkVersion}
        subtitle={app.packageName || app.fullName}
        experienceInfo={{ id: app.id, username: app.username, slug: app.packageName }}
      />
    );
  };

  const renderContents = () => {
    const apps = data.me.apps;
    if (!apps.length) {
      return <EmptyAccountProjectsNotice />;
    }
    const otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));
    return (
      <>
        {take(apps, MAX_APPS_TO_DISPLAY).map(renderApp)}
        <SeeAllProjectsButton
          apps={otherApps}
          appCount={data.me.appCount - MAX_APPS_TO_DISPLAY}
          onPress={onPressProjectList}
        />
      </>
    );
  };

  return (
    <View>
      <SectionHeader title="Recent projects" />
      {renderContents()}
    </View>
  );
}

function ProfileSnacksSection({
  data,
  navigation,
}: Pick<Props, 'navigation'> & {
  data: NonNullable<Props['data']>;
}) {
  const onPressSnackList = () => {
    navigation.navigate('ProfileAllSnacks', {});
  };

  const snacks = data.me.snacks;

  const renderSnack = (snack: any, i: number) => {
    return (
      <SnackListItem
        key={i}
        url={snack.fullName}
        title={snack.name}
        subtitle={snack.description}
        isDraft={snack.isDraft}
        last={i === snacks.length - 1}
      />
    );
  };

  const renderContents = () => {
    if (!snacks?.length) {
      return <EmptyAccountSnacksNotice />;
    }
    const otherSnacks = takeRight(snacks, Math.max(0, snacks.length - MAX_SNACKS_TO_DISPLAY));
    return (
      <>
        {take(snacks, MAX_SNACKS_TO_DISPLAY).map(renderSnack)}
        {otherSnacks.length > 0 && (
          <ListItem title="See all snacks" onPress={onPressSnackList} arrowForward last />
        )}
      </>
    );
  };

  return (
    <View>
      <SectionHeader title="Recent snacks" />
      {renderContents()}
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
    marginBottom: 12,
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
  headerAccountName: {
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
