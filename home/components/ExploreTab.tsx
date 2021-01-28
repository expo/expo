import { useNavigation, useTheme } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import dedent from 'dedent';
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import FeatureFlags from '../FeatureFlags';
import Colors from '../constants/Colors';
import SharedStyles from '../constants/SharedStyles';
import { AllStackRoutes } from '../navigation/Navigation.types';
import PrimaryButton from './PrimaryButton';
import ProjectCard from './ProjectCard';
import { Project } from './ProjectList';
import { StyledText } from './Text';

const NETWORK_ERROR_TEXT = dedent`
  Your connection appears to be offline.
  Check back when you have a better connection.
`;

const SERVER_ERROR_TEXT = dedent`
  An unexpected server error has occurred.
  Sorry about this. We will resolve the issue as soon as quickly as possible.
`;

type QueryProps = {
  loadMoreAsync: () => Promise<unknown>;
  refetch: () => Promise<unknown>;
  loading: boolean;
  error?: Error;
  data?: { apps?: Project[] };
};

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>
      <ActivityIndicator color={Colors.light.tintColor} />
    </View>
  );
}

export default function ExploreTab(props: QueryProps) {
  const { loading, error, refetch, loadMoreAsync, data } = props;

  const navigation: StackNavigationProp<AllStackRoutes, 'ExploreAndSearch'> = useNavigation();
  const theme = useTheme();
  const [isRefetching, setRefetching] = React.useState(false);
  const isLoading = React.useRef<null | boolean>(false);

  const onPressUsername = React.useCallback(
    (username: string) => {
      navigation.push('Profile', { username });
    },
    [navigation]
  );

  const apps = data?.apps;

  if (loading || (isRefetching && !apps)) {
    return <Loading />;
  } else if (error && !apps) {
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

  const renderItem = ({ item: app, index }: { item: Project; index: number }) => {
    return (
      <ProjectCard
        key={index.toString()}
        id={app.id}
        iconUrl={app.iconUrl}
        name={app.name}
        projectUrl={app.fullName}
        username={app.packageUsername}
        description={app.description}
        experienceInfo={{ username: app.packageUsername, slug: app.packageName }}
        sdkVersion={app.sdkVersion}
        onPressUsername={onPressUsername}
        style={{ marginBottom: 10 }}
      />
    );
  };
  const handleLoadMoreAsync = async () => {
    if (isLoading.current) return;
    isLoading.current = true;
    try {
      await loadMoreAsync();
    } catch (e) {
      console.log({ e });
    } finally {
      isLoading.current = false;
    }
  };

  return (
    <FlatList
      data={apps}
      renderItem={renderItem}
      style={[
        styles.container,
        { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground },
      ]}
      keyExtractor={(item: Project) => item.id}
      contentContainerStyle={{ paddingBottom: 5 }}
      renderScrollComponent={(props: React.ComponentProps<typeof InfiniteScrollView>) => {
        // note(brent): renderScrollComponent is passed on to
        // InfiniteScrollView so it renders itself again and the result is two
        // loading indicators. So we need to detect if we're in
        // InfiniteScrollView by checking for a prop that is passed in to it,
        // in this case we'll just check for props.renderLoadingIndicator.
        // This should be fixed upstream in InfiniteScrollView, so if InfiniteScrollView
        // is itself the scroll component being rendered it doesn't once again render
        // the scroll component.
        if (props.renderLoadingIndicator || !FeatureFlags.INFINITE_SCROLL_EXPLORE_TABS) {
          return <ScrollView {...props} />;
        } else {
          return <InfiniteScrollView {...props} />;
        }
      }}
      // @ts-expect-error typescript cannot infer that props should include infinite-scroll-view props
      onLoadMoreAsync={handleLoadMoreAsync}
      canLoadMore={!loading && FeatureFlags.INFINITE_SCROLL_EXPLORE_TABS}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: FeatureFlags.HIDE_EXPLORE_TABS && Platform.OS === 'ios' ? 5 : 10,
  },
});
