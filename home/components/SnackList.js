import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import { useTheme } from 'react-navigation';

import Colors from '../constants/Colors';
import SnackListItem from './SnackListItem';

export default function SnackList({ data, loadMoreAsync, belongsToCurrentUser }) {
  const [isReady, setReady] = React.useState(false);
  const [isLoadingMore, setLoadingMore] = React.useState(false);

  const theme = useTheme();

  React.useEffect(() => {
    const _readyTimer = setTimeout(() => {
      setReady(true);
    }, 500);
    return () => {
      clearTimeout(_readyTimer);
    };
  }, []);

  const _maybeRenderLoading = () => {
    if (!isReady) {
      return (
        <View style={{ flex: 1, padding: 30, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      );
    }
  };

  const _renderContent = () => {
    return (
      <FlatList
        data={data.snacks}
        keyExtractor={_extractKey}
        renderItem={_renderItem}
        renderLoadingIndicator={() => <View />}
        renderScrollComponent={props => <InfiniteScrollView {...props} />}
        style={[
          { flex: 1 },
          !belongsToCurrentUser && styles.largeProjectCardList,
          { backgroundColor: theme === 'dark' ? '#000' : Colors.light.greyBackground },
        ]}
        canLoadMore={_canLoadMore()}
        onLoadMoreAsync={_handleLoadMoreAsync}
      />
    );
  };

  const _extractKey = item => item.slug;

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
      this._isMounted && setLoadingMore(false);
    }
  };

  const _canLoadMore = () => {
    // TODO: replace the code below this comment with the following line
    // once we have implemented snackCount
    // return this.props.data.snacks.length < this.props.data.snackCount;

    if (isLoadingMore) {
      return false;
    } else {
      return true;
    }
  };

  const _renderItem = ({ item: snack, index }) => {
    return (
      <SnackListItem
        key={index.toString()}
        url={snack.fullName}
        title={snack.name}
        subtitle={snack.description}
      />
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {isReady && data.snacks && data.snacks.length ? _renderContent() : _maybeRenderLoading()}
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
