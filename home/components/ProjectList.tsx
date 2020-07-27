import { useNavigation, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import ProjectListItem from './ProjectListItem';

// TODO(Bacon): Fix this
type QueryProps = {
  loading: boolean;
  error?: Error;
  refetch: (props: any) => void;
  data: any;
  loadMoreAsync: () => Promise<any>;
};

function ProjectList({
  belongsToCurrentUser,
  renderLoadingIndicator,
  loading,
  error,
  loadMoreAsync,
  data,
}: QueryProps) {
  const theme = useTheme();
  const navigation = useNavigation();

  const [isReady, setReady] = React.useState(false);
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const _isMounted = React.useRef<null | boolean>(true);
  const _readyTimer = React.useRef<null | number>(null);

  React.useEffect(() => {
    _isMounted.current = true;
    _readyTimer.current = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(_readyTimer.current ?? undefined);
      _isMounted.current = false;
    };
  }, []);

  const _maybeRenderLoading = () => {
    if (!isReady) {
      return (
        <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
          <ActivityIndicator color={Colors.light.tintColor} />
        </View>
      );
    }
  };

  const _renderContent = () => {
    return (
      <FlatList
        data={data.apps}
        keyExtractor={_extractKey}
        renderItem={_renderItem}
        style={[
          { flex: 1 },
          !belongsToCurrentUser && styles.largeProjectCardList,
          { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground },
        ]}
        renderScrollComponent={props => {
          // note(brent): renderScrollComponent is passed on to
          // InfiniteScrollView so it renders itself again and the result is two
          // loading indicators. So we need to detect if we're in
          // InfiniteScrollView by checking for a prop that is passed in to it,
          // in this case we'll just check for props.renderLoadingIndicator.
          // This should be fixed upstream in InfiniteScrollView, so if InfiniteScrollView
          // is itself the scroll component being rendered it doesn't once again render
          // the scroll component.
          if (renderLoadingIndicator) {
            return <ScrollView {...props} />;
          } else {
            return <InfiniteScrollView {...props} />;
          }
        }}
        canLoadMore={_canLoadMore()}
        onLoadMoreAsync={_handleLoadMoreAsync}
      />
    );
  };

  const _extractKey = item => {
    return item.id;
  };

  const _handleLoadMoreAsync = async () => {
    if (isLoadingMore) {
      return;
    }

    try {
      setLoadingMore(true);
      await loadMoreAsync();
    } catch (e) {
      console.log({ e });
    } finally {
      if (_isMounted.current) {
        setLoadingMore(false);
      }
    }
  };

  const _canLoadMore = (): boolean => {
    return data.apps.length < data.appCount;
  };

  const _renderItem = ({ item: app, index }) => {
    if (belongsToCurrentUser) {
      return (
        <ProjectListItem
          key={index.toString()}
          url={app.fullName}
          image={app.iconUrl || require('../assets/placeholder-app-icon.png')}
          title={app.name}
          subtitle={app.packageName || app.fullName}
          last={index === data.apps.length - 1}
        />
      );
    } else {
      return (
        <ProjectCard
          key={index}
          style={styles.largeProjectCard}
          id={app.id}
          iconUrl={app.iconUrl}
          name={app.name}
          projectUrl={app.fullName}
          username={app.packageUsername}
          description={app.description}
          onPressUsername={_handlePressUsername}
        />
      );
    }
  };

  const _handlePressUsername = (username: string) => {
    navigation.navigate('Profile', { username });
  };

  return (
    <View style={{ flex: 1 }}>
      {isReady && data.apps && data.apps.length ? _renderContent() : _maybeRenderLoading()}
    </View>
  );
}

import gql from 'graphql-tag';
import { useQuery } from '@apollo/react-hooks';

const MyProjectsListQuery = gql`
  query Home_MyApps($limit: Int!, $offset: Int!) {
    me {
      id
      appCount
      email
      firstName
      id
      isLegacy
      lastName
      profilePhoto
      username
      apps(limit: $limit, offset: $offset) {
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

function useMyProjectsGQL() {
  const query = useQuery(MyProjectsListQuery, {
    variables: {
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data } = query;

  let apps;
  let appCount;
  if (data.me) {
    apps = data.me.apps;
    appCount = data.me.appCount;
  }

  return {
    ...query,
    data: {
      ...data,
      apps,
      appCount,
    },
    loadMoreAsync() {
      return query.fetchMore({
        variables: {
          offset: (apps && apps.length) || 0,
        },
        updateQuery: (previousData, { fetchMoreResult }) => {
          if (!fetchMoreResult || !fetchMoreResult.me) {
            return previousData;
          }

          const combinedData = {
            me: {
              ...previousData.me,
              ...fetchMoreResult.me,
              apps: [...previousData.me.apps, ...fetchMoreResult.me.apps],
            },
          };

          return {
            ...combinedData,
            appCount: combinedData.me.appCount,
            apps: combinedData.me.apps,
          };
        },
      });
    },
  };
}

const OtherProjectsQuery = gql`
  query Home_UsersApps($username: String!, $limit: Int!, $offset: Int!) {
    user {
      byUsername(username: $username) {
        id
        appCount
        apps(limit: $limit, offset: $offset) {
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

function useOtherProjectsGQL({ username }: { username: string }) {
  const query = useQuery(OtherProjectsQuery, {
    variables: {
      username: username.replace('@', ''),
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });

  const { data } = query;
  let apps, appCount;
  if (data.user && data.user.byUsername) {
    apps = data.user.byUsername.apps;
    appCount = data.user.byUsername.appCount;
  }

  return {
    ...query,
    data: {
      ...data,
      appCount,
      apps,
    },
    loadMoreAsync() {
      return query.fetchMore({
        variables: {
          offset: apps.length,
        },
        updateQuery: (previousData, { fetchMoreResult }) => {
          if (!fetchMoreResult.user || !fetchMoreResult.user.byUsername) {
            return previousData;
          }

          const combinedData = {
            user: {
              ...previousData.user,
              ...fetchMoreResult.user,
              byUsername: {
                ...previousData.user.byUsername,
                ...fetchMoreResult.user.byUsername,
                apps: [
                  ...previousData.user.byUsername.apps,
                  ...fetchMoreResult.user.byUsername.apps,
                ],
              },
            },
          };

          return {
            ...combinedData,
            appCount: combinedData.user.byUsername.appCount,
            apps: combinedData.user.byUsername.apps,
          };
        },
      });
    },
  };
}

export function MyProjectsList(props: { belongsToCurrentUser: boolean }) {
  const query = useMyProjectsGQL();
  return <ProjectList {...props} {...query} />;
}

export function OtherProjectsList(props: { username: string }) {
  const query = useOtherProjectsGQL(props);
  return <ProjectList {...props} {...query} />;
}

const styles = StyleSheet.create({
  largeProjectCardList: {
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: Colors.light.greyBackground,
  },
  largeProjectCard: {
    marginBottom: 10,
  },
});
