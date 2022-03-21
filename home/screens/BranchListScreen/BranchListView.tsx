import { Divider, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, FlatList, View as RNView } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import { BranchListItem } from '../../components/BranchListItem';
import { BranchesForProjectQuery } from '../../graphql/types';

type BranchManifest = {
  name: string;
  id: string;
  latestUpdate: BranchesForProjectQuery['app']['byId']['updateBranches'][0]['updates'][0];
  sdkVersion: number | null;
};

type Props = {
  data: BranchManifest[];
  loadMoreAsync: () => Promise<any>;
};

export function BranchListView(props: Props) {
  const [isReady, setReady] = React.useState(false);

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
      <RNView style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator />
      </RNView>
    );
  }

  if (!props.data?.length) {
    return <RNView style={{ flex: 1 }} />;
  }

  return <BranchList {...props} />;
}

function BranchList({ data, loadMoreAsync }: Props) {
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const isLoading = React.useRef<null | boolean>(false);

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
    if (isLoadingMore) {
      return false;
    } else {
      return true;
    }
  };

  const renderItem = React.useCallback(({ item: branch }) => {
    return <BranchListItem key={branch.id} name={branch.name} latestUpdate={branch.latestUpdate} />;
  }, []);

  return (
    <View flex="1" padding="medium">
      <View bg="default" border="hairline" rounded="large" overflow="hidden">
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
