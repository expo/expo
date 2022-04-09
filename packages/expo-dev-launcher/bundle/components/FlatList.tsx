import { scale, View } from 'expo-dev-client-components';
import * as React from 'react';
import {
  RefreshControl,
  FlatListProps as RNFlatListProps,
  FlatList as RNFlatList,
} from 'react-native';

import { useThrottle } from '../hooks/useDebounce';
import { ActivityIndicator } from './ActivityIndicator';

type FlatListProps<T> = RNFlatListProps<T> & {
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh: () => void;
};

export function FlatListLoader() {
  return (
    <View margin="medium" height="44" align="centered" bg="default" rounded="large">
      <ActivityIndicator />
    </View>
  );
}

export function FlatList<T>({
  isLoading,
  isRefreshing,
  onRefresh,
  ...flatlistProps
}: FlatListProps<T>) {
  const throttledRefresh = useThrottle(isRefreshing, 800);

  if (isLoading) {
    return <FlatListLoader />;
  }

  return (
    <View flex="1">
      <RNFlatList
        style={{ flex: 1 }}
        refreshing={throttledRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scale[24] }}
        refreshControl={
          <RefreshControl
            style={{ opacity: 1 }}
            refreshing={throttledRefresh}
            onRefresh={onRefresh}
          />
        }
        {...flatlistProps}
      />
    </View>
  );
}
