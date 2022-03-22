import { useNavigation } from '@react-navigation/native';
import { Heading, View, Button, Divider } from 'expo-dev-client-components';
import * as React from 'react';

import { EASBranchRow } from '../components/EASUpdatesRows';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';

export function EASUpdatesScreen() {
  const navigation = useNavigation();
  const { appId } = useBuildInfo();
  const {
    data: branches,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useBranchesForApp(appId);

  function onBranchPress(branchName: string) {
    navigation.navigate('Branch', { branchName });
  }

  function Header() {
    return (
      <View py="small" px="small">
        <Heading size="small" color="secondary">
          Recently updated branches
        </Heading>
      </View>
    );
  }

  function Footer() {
    if (hasNextPage) {
      return <LoadMoreButton isLoading={isFetchingNextPage} onPress={fetchNextPage} />;
    }

    return null;
  }

  function renderBranch({ index, item: branch }: { index: number; item: Branch }) {
    const isFirst = index === 0;
    const isLast = index === branches?.length - 1;

    return (
      <Button.ScaleOnPressContainer
        bg="default"
        onPress={() => onBranchPress(branch.name)}
        roundedBottom={isLast ? 'large' : 'none'}
        roundedTop={isFirst ? 'large' : 'none'}>
        <View
          bg="default"
          roundedTop={isFirst ? 'large' : 'none'}
          roundedBottom={isLast ? 'large' : 'none'}
          py="small"
          px="small">
          <EASBranchRow branch={branch} />
        </View>
      </Button.ScaleOnPressContainer>
    );
  }

  return (
    <View flex="1" px="medium">
      <FlatList
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        onRefresh={() => refetch()}
        ListHeaderComponent={Header}
        extraData={{ length: branches.length, hasNextPage }}
        data={branches}
        ItemSeparatorComponent={Divider}
        renderItem={renderBranch}
        keyExtractor={(item) => item?.id}
        ListFooterComponent={Footer}
      />
    </View>
  );
}
