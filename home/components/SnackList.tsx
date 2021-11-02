import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';

import Colors from '../constants/Colors';
import SnackListItem from './SnackListItem';

export type Snack = {
  name: string;
  fullName: string;
  slug: string;
  description: string;
  isDraft?: boolean;
};

type Props = {
  data: Snack[];
  loadMoreAsync: () => Promise<any>;
};

export default function LoadingSnackList(props: Props) {
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
      <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!props.data?.length) {
    return <View style={{ flex: 1 }} />;
  }

  return <SnackList {...props} />;
}

function SnackList({ data, loadMoreAsync }: Props) {
  const [isLoadingMore, setLoadingMore] = React.useState(false);
  const isLoading = React.useRef<null | boolean>(false);

  const theme = useTheme();

  const extractKey = React.useCallback((item) => item.slug, []);

  const handleLoadMoreAsync = async () => {
    if (isLoading.current) return;
    isLoading.current = true;
    setLoadingMore(true);

    try {
      await loadMoreAsync();
    } catch (e) {
      console.log({ e });
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
      <SnackListItem
        key={index.toString()}
        url={snack.fullName}
        title={snack.name}
        subtitle={snack.description}
        isDraft={snack.isDraft}
      />
    );
  }, []);

  const style = React.useMemo(
    () => [{ flex: 1 }, { backgroundColor: theme.dark ? '#000' : Colors.light.greyBackground }],
    [theme]
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={data}
        keyExtractor={extractKey}
        renderItem={renderItem}
        // @ts-expect-error typescript cannot infer that props should include infinite-scroll-view props
        renderLoadingIndicator={() => <View />}
        renderScrollComponent={(props) => <InfiniteScrollView {...props} />}
        style={style}
        canLoadMore={canLoadMore()}
        onLoadMoreAsync={handleLoadMoreAsync}
      />
    </View>
  );
}
