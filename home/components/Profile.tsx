import dedent from 'dedent';
import { take, takeRight } from 'lodash';
import React from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import FadeIn from 'react-native-fade-in-image';

import ListItem from '../components/ListItem';
import ScrollView from '../components/NavigationScrollView';
import ProjectListItem from '../components/ProjectListItem';
import RefreshControl from '../components/RefreshControl';
import SectionHeader from '../components/SectionHeader';
import { StyledText } from '../components/Text';
import { StyledView } from '../components/Views';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import EmptyProfileProjectsNotice from './EmptyProfileProjectsNotice';
import EmptyProfileSnacksNotice from './EmptyProfileSnacksNotice';
import PrimaryButton from './PrimaryButton';
import SeeAllProjectsButton from './SeeAllProjectsButton';
import SnackListItem from './SnackListItem';
import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from '../navigation/Navigation.types';

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

import gql from 'graphql-tag';
import { flowRight } from 'lodash';

import { graphql } from 'react-apollo';

import SessionActions from '../redux/SessionActions';

const OtherUserProfileQuery = gql`
  query Home_UserByUsername($username: String!) {
    user {
      byUsername(username: $username) {
        id
        username
        firstName
        lastName
        email
        profilePhoto
        isLegacy
        appCount
        apps(limit: 15, offset: 0) {
          id
          fullName
          name
          iconUrl
          packageName
          packageUsername
          description
          lastPublishedTime
        }
        snacks(limit: 15, offset: 0) {
          name
          description
          fullName
          slug
        }
      }
    }
  }
`;

import { useQuery } from '@apollo/react-hooks';

const MyProfileQuery = gql`
  query Home_MyProfile {
    me {
      id
      appCount
      email
      firstName
      isLegacy
      lastName
      profilePhoto
      username
      apps(limit: 15, offset: 0) {
        id
        description
        fullName
        iconUrl
        lastPublishedTime
        name
        packageName
        privacy
      }
      snacks(limit: 15, offset: 0) {
        name
        description
        fullName
        slug
      }
    }
  }
`;

function useMyProfileGQL() {
  const query = useQuery(MyProfileQuery, {
    fetchPolicy: 'cache-and-network',
  });

  return {
    ...query,
    data: {
      ...query.data,
      user: query.data?.me,
    },
  };
}

function useOtherProfileGQL({ username }: Pick<SharedProps, 'username'>) {
  const query = useQuery(OtherUserProfileQuery, {
    fetchPolicy: 'network-only',
    variables: {
      username: username ? username.replace('@', '') : '',
    },
  });

  return {
    ...query,
    data: {
      ...query.data,
      user: query.data?.user ? query.data.user?.byUsername : null,
    },
  };
}

import { useDispatch, useSelector } from 'react-redux';

type SharedProps = {
  isOwnProfile: boolean;
  username: string;
  isAuthenticated: boolean;
} & StackScreenProps<AllStackRoutes, 'Profile'>;

// todo
type QueryProps = {
  loading: boolean;
  error?: Error;
  refetch: (props: any) => void;
  data: any;
};

export function MyProfile(props: SharedProps) {
  const dispatch = useDispatch();
  const query = useMyProfileGQL();
  const { loading, error, data } = query;

  // We verify that the viewer is logged in when we receive data from the server; if the viewer
  // isn't logged in, we clear our locally stored credentials
  React.useEffect(() => {
    if (!loading && !error && !data.user) {
      dispatch(SessionActions.signOut());
    }
  }, [loading, error, data.user]);

  return <Profile {...props} {...query} />;
}

export function OtherProfile(props: SharedProps) {
  const query = useOtherProfileGQL(props);
  return <Profile {...props} {...query} />;
}

function Profile({
  username,
  navigation,
  isOwnProfile,
  loading,
  error,
  refetch,
  data,
}: SharedProps & QueryProps) {
  const [isRefetching, setRefreshing] = React.useState(false);
  const mounted = React.useRef<boolean | null>(true);

  React.useEffect(() => {
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
    if (isRefetching) {
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

  const _renderError = () => {
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

        <PrimaryButton plain onPress={_handleRefreshAsync} fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>

        {isRefetching && (
          <View style={{ marginTop: 20 }}>
            <ActivityIndicator color={Colors.light.tintColor} />
          </View>
        )}
      </ScrollView>
    );
  };

  function _renderLoading() {
    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
    );
  }

  const _renderHeader = () => {
    if (!data.user) {
      return;
    }

    if (data.user.isLegacy) {
      return _renderLegacyHeader();
    }

    const { firstName, lastName, username, profilePhoto } = data.user;

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
  };

  const _renderLegacyHeader = () => {
    const { username } = data.user;

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
  };

  const _renderApps = () => {
    if (!data.user) {
      return;
    }

    const { apps, appCount } = data.user;
    let content;

    if (!apps || !apps.length) {
      content = <EmptyProfileProjectsNotice isOwnProfile={isOwnProfile} />;
    } else {
      const otherApps = takeRight(apps, Math.max(0, apps.length - MAX_APPS_TO_DISPLAY));
      content = (
        <>
          {take(apps, MAX_APPS_TO_DISPLAY).map(_renderApp)}
          <SeeAllProjectsButton
            apps={otherApps}
            appCount={appCount - MAX_APPS_TO_DISPLAY}
            onPress={_handlePressProjectList}
          />
        </>
      );
    }

    return (
      <View>
        <SectionHeader title="Published projects" />
        {content}
      </View>
    );
  };

  const _renderSnacks = () => {
    if (!data.user) {
      return;
    }

    const { snacks } = data.user;
    let content;

    if (!snacks || !snacks.length) {
      content = <EmptyProfileSnacksNotice isOwnProfile={isOwnProfile} />;
    } else {
      const otherSnacks = takeRight(snacks, Math.max(0, snacks.length - MAX_SNACKS_TO_DISPLAY));
      content = (
        <>
          {take(snacks, MAX_SNACKS_TO_DISPLAY).map(_renderSnack)}
          {otherSnacks.length > 0 && (
            <ListItem title="See all snacks" onPress={_handlePressSnackList} arrowForward last />
          )}
        </>
      );
    }

    return (
      <View>
        <SectionHeader title="Saved snacks" />
        {content}
      </View>
    );
  };

  const _handlePressProjectList = () => {
    navigation.navigate('ProjectsForUser', {
      username: username,
      belongsToCurrentUser: isOwnProfile,
    });
  };

  const _handlePressSnackList = () => {
    navigation.navigate('SnacksForUser', {
      username: username,
      belongsToCurrentUser: isOwnProfile,
    });
  };

  const _renderApp = (app: any, i: number) => {
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

  const _renderSnack = (snack: any, i: number) => {
    return (
      <SnackListItem key={i} url={snack.fullName} title={snack.name} subtitle={snack.description} />
    );
  };

  function _maybeRenderGithubAccount() {
    // ..
  }

  // NOTE(brentvatne): investigate why `user` is null when there
  // is an error, even if it loaded before. This seems undesirable,
  // can it be avoided with apollo-client?

  if (error && !data.user) {
    return _renderError();
  }

  if (loading && !data.user) {
    return _renderLoading();
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={_handleRefreshAsync} />}
      contentContainerStyle={{ paddingBottom: 20 }}
      style={styles.container}>
      {_renderHeader()}
      {_renderApps()}
      {_renderSnacks()}
    </ScrollView>
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
