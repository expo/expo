import { Divider, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, FlatList, View as RNView } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import { SnacksListItem } from '../../components/SnacksListItem';
import { CommonSnackDataFragment } from '../../graphql/types';

type Props = {
  data: CommonSnackDataFragment[];
  loadMoreAsync: () => Promise<any>;
};

export function SnackListView(props: Props) {
  const [isReady, setReady] = React.useState(false);
  const theme = useExpoTheme();

  React.useEffect(() => {
    const _readyTimer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(_readyTimer);
    };
  }, []);

  if (!isReady) {
    return (
      <RNView
        style={{
          flex: 1,
          padding: 30,
          alignItems: 'center',
          backgroundColor: theme.background.screen,
        }}>
        <ActivityIndicator />
      </RNView>
    );
  }

  if (!props.data?.length) {
    return <RNView style={{ flex: 1, backgroundColor: theme.background.screen }} />;
  }

  return <SnackList {...props} />;
}

function SnackList({ data, loadMoreAsync }: Props) {
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const isLoading = React.useRef<null | boolean>(false);
  const theme = useExpoTheme();

  const extractKey = React.useCallback((item) => item.slug, []);

  const handleLoadMoreAsync = async () => {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoadingMore(true);

    try {
      await loadMoreAsync();
    } catch (e) {
      console.error(e);
    } finally {
      isLoading.current = false;
      setLoadingMore(false);
    }
  };

  const canLoadMore = () => {
    // TODO: replace the code below this comment with the following line
    // once we have implemented snackCount
    // return this.props.data.snacks.length < this.props.data.snackCount;

    if (isLoadingMore) {
      return false;
    } else {
      return true;
    }
  };

  const renderItem = React.useCallback(({ item: snack, index }) => {
    return (
      <SnacksListItem
        key={index.toString()}
        url={snack.fullName}
        name={snack.name}
        description={snack.description}
        isDraft={snack.isDraft}
      />
    );
  }, []);

  return (
    <View
      flex="1"
      padding="medium"
      style={{
        backgroundColor: theme.background.screen,
      }}>
      <View overflow="hidden" bg="default" border="hairline" rounded="large">
        <FlatList
          data={data}
          keyExtractor={extractKey}
          renderItem={renderItem}
          // @ts-expect-error typescript cannot infer that props should include infinite-scroll-view props
          renderLoadingIndicator={() => <RNView />}
          renderScrollComponent={(props) => <InfiniteScrollView {...props} />}
          ItemSeparatorComponent={Divider}
          canLoadMore={canLoadMore()}
          onLoadMoreAsync={handleLoadMoreAsync}
        />
      </View>
    </View>
  );
}
