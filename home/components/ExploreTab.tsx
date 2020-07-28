import { useQuery } from '@apollo/client';
import { useTheme } from '@react-navigation/native';
import dedent from 'dedent';
import gql from 'graphql-tag';
import * as React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import FeatureFlags from '../FeatureFlags';
import PrimaryButton from './PrimaryButton';
import ProjectCard, { PressUsernameHandler } from './ProjectCard';
import SectionHeader from './SectionHeader';
import { StyledText } from './Text';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

type AppItem = {
  id: string;
  packageUsername: string;
  fullName: string;
  iconUrl: string;
  name: string;
  description: string;
};

type Data = {
  readonly apps: AppItem[];
  refetch: () => Promise<any>;
  loading: boolean;
  error?: { message: string };
};

type Props = {
  filter: string;
  // data: Data;
  loadMoreAsync: boolean;
  listTitle: string;
  onPressUsername: PressUsernameHandler;
};

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
      <ActivityIndicator color={Colors.light.tintColor} />
    </View>
  );
}

const PublicAppsQuery = gql`
  query Home_FindPublicApps($limit: Int, $offset: Int, $filter: AppsFilter!) {
    app {
      all(limit: $limit, offset: $offset, sort: RECENTLY_PUBLISHED, filter: $filter) {
        id
        fullName
        name
        iconUrl
        packageName
        packageUsername
        description
        lastPublishedTime
      }
    }
  }
`;

function useExploreTabGQL(props: { filter: string }) {
  const query = useQuery(PublicAppsQuery, {
    fetchPolicy: 'network-only',
    variables: {
      filter: props.filter,
      limit: 10,
      offset: 0,
    },
  });

  return {
    ...query,
    data: {
      ...query.data,
      apps: query?.data?.app?.all ?? null,
    },
    loadMoreAsync() {
      return query?.fetchMore({
        variables: {
          ...(props.filter ? { filter: props.filter } : {}),
          limit: 10,
          offset: query.data.apps?.length,
        },
        updateQuery: (previousData: any, { fetchMoreResult }) => {
          const previousApps = previousData.app && previousData.app.all;
          if (!fetchMoreResult?.data) {
            return previousData;
          }
          return { ...previousData, apps: [...previousApps, ...fetchMoreResult.data.app.all] };
        },
      });
    },
  };
}

export default function ExploreTab(props: Props) {
  const { loading, error, refetch, data } = useExploreTabGQL({ filter: props.filter });

  const theme = useTheme();
  const [isRefetching, setRefetching] = React.useState(false);

  // Content
  const extraOptions = React.useMemo<Partial<React.ComponentProps<typeof FlatList>>>(() => {
    if (!FeatureFlags.INFINITE_SCROLL_EXPLORE_TABS) {
      return {};
    }
    return {
      renderScrollComponent: props => <InfiniteScrollView {...props} />,
      canLoadMore: true,
      onLoadMoreAsync: props.loadMoreAsync,
    };
  }, [props.loadMoreAsync]);

  if (loading || (isRefetching && !data.apps)) {
    return <Loading />;
  } else if (error && !data.apps) {
    // Error
    // NOTE(brentvatne): sorry for this
    const isConnectionError = error.message.includes('No connection available');

    const refetchDataAsync = async () => {
      try {
        setRefetching(true);
        await refetch();
      } catch (e) {
        console.log({ e });
        // Error!
      } finally {
        setRefetching(false);
      }
    };

    return (
      <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
        <StyledText
          style={SharedStyles.noticeDescriptionText}
          lightColor="rgba(36, 44, 58, 0.7)"
          darkColor="#ccc">
          {isConnectionError ? NETWORK_ERROR_TEXT : SERVER_ERROR_TEXT}
        </StyledText>

        <PrimaryButton plain onPress={refetchDataAsync} fallback={TouchableOpacity}>
          Try again
        </PrimaryButton>
      </View>
    );
  }

  const renderHeader = () => {
    return props.listTitle ? <SectionHeader title={props.listTitle} /> : <View />;
  };

  const renderItem = ({ item: app, index }: { item: AppItem; index: number }) => {
    return (
      <ProjectCard
        key={index.toString()}
        id={app.id}
        iconUrl={app.iconUrl}
        name={app.name}
        projectUrl={app.fullName}
        username={app.packageUsername}
        description={app.description}
        onPressUsername={props.onPressUsername}
        style={{ marginBottom: 10 }}
      />
    );
  };

  return (
    <FlatList<AppItem>
      data={data.apps!}
      ListHeaderComponent={renderHeader}
      renderItem={renderItem}
      style={[
        styles.container,
        { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground },
      ]}
      keyExtractor={item => item.id}
      contentContainerStyle={{ paddingBottom: 5 }}
      {...extraOptions}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: FeatureFlags.HIDE_EXPLORE_TABS && Platform.OS === 'ios' ? 5 : 10,
  },
});
