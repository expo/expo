import { StackNavigationProp } from '@react-navigation/stack';
import { Heading, View, Divider, Spacer, Text } from 'expo-dev-client-components';
import * as React from 'react';

import { ExtensionsStackParamList } from './ExtensionsStack';
import { BasicButton } from '../components/BasicButton';
import { EASBranchRow, EASEmptyBranchRow } from '../components/EASUpdatesRows';
import { EmptyBranchesMessage } from '../components/EmptyBranchesMessage';
import { FlatList } from '../components/FlatList';
import { ScreenContainer } from '../components/ScreenContainer';
import { getRecentRuntime } from '../functions/getRecentRuntime';
import { useOnUpdatePress } from '../hooks/useOnUpdatePress';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { useUser } from '../providers/UserContextProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';

type BranchesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function BranchesScreen({ navigation }: BranchesScreenProps) {
  const { appId } = useUpdatesConfig();
  const { isAuthenticated } = useUser();
  const {
    data: branches,
    emptyBranches,
    incompatibleBranches,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useBranchesForApp(appId, isAuthenticated);

  const { loadingUpdateId, onUpdatePress } = useOnUpdatePress();

  function Header() {
    if (branches.length > 0) {
      return (
        <View py="small" px="small">
          <Heading size="small" color="secondary">
            Branches
          </Heading>
        </View>
      );
    }

    return null;
  }

  function Footer() {
    const latestRuntimeVersion = getRecentRuntime(incompatibleBranches);

    return (
      <View>
        {branches.length > 0 && hasNextPage && (
          <View align="centered" mt="small">
            <BasicButton
              label="Load More"
              size="small"
              isLoading={isFetchingNextPage}
              onPress={() => fetchNextPage()}
            />
          </View>
        )}

        <RecentlyCreatedBranches branches={emptyBranches} navigation={navigation} />

        {branches.length === 0 && hasNextPage && (
          <View align="centered" mt="small">
            <BasicButton
              label="Load More"
              size="small"
              isLoading={isFetchingNextPage}
              onPress={() => fetchNextPage()}
            />
          </View>
        )}

        {incompatibleBranches.length > 0 && (
          <View px="small" mt="medium">
            <Text size="small" color="secondary">
              {getIncompatibleBranchMessage(incompatibleBranches.length)}
            </Text>
            {Boolean(latestRuntimeVersion != null) && (
              <>
                <Spacer.Vertical size="small" />
                <Text size="small" color="secondary">
                  {`A recent update was published with runtime version "${latestRuntimeVersion}".`}
                </Text>
              </>
            )}
          </View>
        )}
      </View>
    );
  }

  function EmptyList() {
    if (emptyBranches.length === 0) {
      return (
        <View>
          <Spacer.Vertical size="medium" />
          <EmptyBranchesMessage branches={branches} incompatibleBranches={incompatibleBranches} />
        </View>
      );
    }

    return null;
  }

  function renderBranch({ index, item: branch }: { index: number; item: Branch }) {
    const isFirst = index === 0;
    const isLast = index === branches?.length - 1;
    const isLoading = loadingUpdateId === branch.updates[0]?.id;

    return (
      <EASBranchRow
        branch={branch}
        isFirst={isFirst}
        isLast={isLast}
        isLoading={isLoading}
        navigation={navigation}
        onUpdatePress={onUpdatePress}
      />
    );
  }

  return (
    <ScreenContainer>
      <View flex="1" px="medium">
        <FlatList
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={() => refetch()}
          ListHeaderComponent={Header}
          extraData={{ length: branches.length, hasNextPage, loadingUpdateId }}
          data={branches}
          ItemSeparatorComponent={Divider}
          renderItem={renderBranch}
          keyExtractor={(item) => item?.id}
          ListFooterComponent={Footer}
          ListEmptyComponent={EmptyList}
        />
      </View>
    </ScreenContainer>
  );
}

type RecentlyCreatedBranchesProps = {
  branches: Branch[];
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

function RecentlyCreatedBranches({ branches, navigation }: RecentlyCreatedBranchesProps) {
  if (branches.length === 0) {
    return null;
  }

  return (
    <View>
      <Spacer.Vertical size="medium" />

      <View py="small" px="small">
        <Heading size="small" color="secondary">
          Recently created branches
        </Heading>
      </View>

      {branches.slice(0, 3).map((branch, index, arr) => {
        const isFirst = index === 0;
        const isLast = index === arr?.length - 1;

        return (
          <View key={branch.id}>
            <EASEmptyBranchRow
              branch={branch}
              isFirst={isFirst}
              isLast={isLast}
              navigation={navigation}
            />
            {!isLast && <Divider />}
          </View>
        );
      })}

      <Spacer.Vertical size="small" />
    </View>
  );
}

export function getIncompatibleBranchMessage(numberOfIncompatibleBranches: number) {
  if (numberOfIncompatibleBranches === 1) {
    return `There is 1 branch that is not compatible with this development build. To preview it, download or build a development client that matches its runtime version.`;
  }

  return `There are ${numberOfIncompatibleBranches} branches that are not compatible with this development build. To preview them, download or build a development client that matches their runtime version.`;
}
