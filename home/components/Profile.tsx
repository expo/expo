import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { take, takeRight } from 'lodash';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import { Project } from '../components/ProjectList';
import ProjectListItem from '../components/ProjectListItem';
import RefreshControl from '../components/RefreshControl';
import SectionHeader from '../components/SectionHeader';
import { Snack } from '../components/SnackList';
import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { AllStackRoutes } from '../navigation/Navigation.types';
import EmptyProfileProjectsNotice from './EmptyProfileProjectsNotice';
import EmptyProfileSnacksNotice from './EmptyProfileSnacksNotice';
import PrimaryButton from './PrimaryButton';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SnackListItem from './SnackListItem';

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

export type ProfileViewProps = {
  isOwnProfile: boolean;
  username: string;
  isAuthenticated: boolean;
} & StackScreenProps<AllStackRoutes, 'Profile'>;

type QueryProps = {
  loading: boolean;
  error?: Error;
  refetch: (props: any) => void;
  data: any;
};

export type Profile = {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  isLegacy: boolean;
  appCount: number;
  apps: Project[];
  snacks: Snack[];
};

type Props = ProfileViewProps & QueryProps;

export default function ProfileView({
  username,
  navigation,
  isOwnProfile,
  loading,
  error,
  refetch,
  data,
}: Props) {
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
      await refetch({ fetchPolicy: 'network-only' });
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

  // NOTE(brentvatne): investigate why `user` is null when there
  // is an error, even if it loaded before. This seems undesirable,
  // can it be avoided with apollo-client?

  if (error && !data.user) {
    return (
      <ProfileError error={error} isRefetching={isRefreshing} onRefresh={_handleRefreshAsync} />
    );
  }

  if (loading && !data.user) {
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
      {data.user && (
        <>
          <ProfileHeader data={data} />
          <ProfileProjectsSection
            data={data}
            isOwnProfile={isOwnProfile}
            navigation={navigation}
            username={username}
          />
          <ProfileSnacksSection
            data={data}
            isOwnProfile={isOwnProfile}
            navigation={navigation}
            username={username}
          />
        </>
      )}
    </ScrollView>
  );
}

function ProfileError({
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

function ProfileHeader({ data }: Pick<Props, 'data'>) {
  const { firstName, lastName, username, profilePhoto } = data.user;

  if (data.user.isLegacy) {
    // Legacy Header
    return (
      <View style={styles.header}>
        <View
          style={[styles.headerAvatar, styles.headerAvatarContainer, styles.legacyHeaderAvatar]}
        />
        <View style={styles.headerAccountsList}>
          <Text style={styles.headerAccountText}>@{username}</Text>
        </View>
      </View>
    );
  }

  function _maybeRenderGithubAccount() {
    // ..
  }

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
          @{username}
        </StyledText>
        {_maybeRenderGithubAccount()}
      </View>
    </StyledView>
  );
}

function ProfileProjectsSection({
  data: {
    user: { apps, appCount },
  },
  isOwnProfile,
  navigation,
  username,
}: Pick<Props, 'data' | 'isOwnProfile' | 'navigation' | 'username'>) {
  const onPressProjectList = () => {
    navigation.navigate('ProjectsForUser', {
      username: username,
      belongsToCurrentUser: isOwnProfile,
    });
  };

  const renderApp = (app: any, i: number) => {
    return (
      <ProjectListItem
        key={i}
        url={app.fullName}
        unlisted={app.privacy === 'unlisted'}
        image={app.iconUrl || require('../assets/placeholder-app-icon.png')}
        title={app.name}
        subtitle={app.packageName || app.fullName}
      />
    );
  };

  const renderContents = () => {
    if (!apps?.length) {
      return <EmptyProfileProjectsNotice isOwnProfile={isOwnProfile} />;
    }
    const otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));
    return (
      <>
        {take(apps, MAX_APPS_TO_DISPLAY).map(renderApp)}
        <SeeAllProjectsButton
          apps={otherApps}
          appCount={appCount - MAX_APPS_TO_DISPLAY}
          onPress={onPressProjectList}
        />
      </>
    );
  };

  return (
    <View>
      <SectionHeader title="Published projects" />
      {renderContents()}
    </View>
  );
}

function ProfileSnacksSection({
  data: {
    user: { snacks },
  },
  isOwnProfile,
  navigation,
  username,
}: Pick<Props, 'data' | 'isOwnProfile' | 'navigation' | 'username'>) {
  const onPressSnackList = () => {
    navigation.navigate('SnacksForUser', {
      username: username,
      belongsToCurrentUser: isOwnProfile,
    });
  };

  const renderSnack = (snack: any, i: number) => {
    return (
      <SnackListItem key={i} url={snack.fullName} title={snack.name} subtitle={snack.description} />
    );
  };

  const renderContents = () => {
    if (!snacks?.length) {
      return <EmptyProfileSnacksNotice isOwnProfile={isOwnProfile} />;
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
      <SectionHeader title="Saved snacks" />
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
