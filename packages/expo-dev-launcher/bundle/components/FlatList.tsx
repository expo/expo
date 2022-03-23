import { scale, View } from 'expo-dev-client-components';
import * as React from 'react';
import { RefreshControl, FlatListProps as RNFlatListProps } from 'react-native';
import { FlatList as RNFlatList } from 'react-native-gesture-handler';

import { useThrottle } from '../hooks/useDebounce';
import { ActivityIndicator } from './ActivityIndicator';

type FlatListProps<T> = RNFlatListProps<T> & {
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh: () => void;
};

export function FlatList<T>({
  isLoading,
  isRefreshing,
  onRefresh,
  ...flatlistProps
}: FlatListProps<T>) {
  const throttledRefresh = useThrottle(isRefreshing, 800);

  if (isLoading) {
    return (
      <View margin="medium" height="44" align="centered" bg="default" rounded="large">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View flex="1">
      <RNFlatList
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: scale[22] }}
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
