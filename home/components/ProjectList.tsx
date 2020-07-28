import { useNavigation, useTheme } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import ProjectCard from './ProjectCard';
import ProjectListItem from './ProjectListItem';

export type Project = {
  id: string;
  description?: string;
  fullName: string;
  iconUrl: string;
  lastPublishedTime: number;
  name: string;
  packageName: string;
  privacy: string;
  packageUsername?: string;
};

type Props = {
  data: { apps?: Project[]; appCount?: number };
  loadMoreAsync: () => Promise<any>;
  belongsToCurrentUser?: true;
};

export default function LoadingProjectList(props: Props) {
  const [isReady, setReady] = React.useState(false);

  React.useEffect(() => {
    const readyTimer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(readyTimer);
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator color={Colors.light.tintColor} />
      </View>
    );
  }

  if (!props.data?.apps?.length) {
    return <View style={{ flex: 1 }} />;
  }

  return <ProjectList {...props} />;
}

function ProjectList({ data, loadMoreAsync, belongsToCurrentUser }: Props) {
  const theme = useTheme();
  const navigation = useNavigation();
  const isLoading = React.useRef<null | boolean>(false);

  const extractKey = React.useCallback(item => item.id, []);

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

  const currentAppCount = data.apps?.length ?? 0;
  const totalAppCount = data.appCount ?? 0;
  const canLoadMore = currentAppCount < totalAppCount;

  const handlePressUsername = (username: string) => {
    navigation.navigate('Profile', { username });
  };

  const renderItem = ({ item: app, index }) => {
    if (belongsToCurrentUser) {
      return (
        <ProjectListItem
          key={index.toString()}
          url={app.fullName}
          image={app.iconUrl || require('../assets/placeholder-app-icon.png')}
          title={app.name}
          subtitle={app.packageName || app.fullName}
          last={index === currentAppCount - 1}
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
          onPressUsername={handlePressUsername}
        />
      );
    }
  };

  const style = React.useMemo(
    () => [
      { flex: 1 },
      !belongsToCurrentUser && styles.largeProjectCardList,
      { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground },
    ],
    [belongsToCurrentUser, theme]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data.apps}
        keyExtractor={extractKey}
        renderItem={renderItem}
        style={style}
        renderScrollComponent={(props: React.ComponentProps<typeof InfiniteScrollView>) => {
          // note(brent): renderScrollComponent is passed on to
          // InfiniteScrollView so it renders itself again and the result is two
          // loading indicators. So we need to detect if we're in
          // InfiniteScrollView by checking for a prop that is passed in to it,
          // in this case we'll just check for props.renderLoadingIndicator.
          // This should be fixed upstream in InfiniteScrollView, so if InfiniteScrollView
          // is itself the scroll component being rendered it doesn't once again render
          // the scroll component.
          if (props.renderLoadingIndicator) {
            return <ScrollView {...props} />;
          } else {
            return <InfiniteScrollView {...props} />;
          }
        }}
        canLoadMore={canLoadMore}
        onLoadMoreAsync={handleLoadMoreAsync}
      />
    </View>
  );
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
