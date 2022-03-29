import { StackNavigationProp } from '@react-navigation/stack';
import { Heading, View, Button, Divider, Spacer, Text } from 'expo-dev-client-components';
import * as React from 'react';

import { EASBranchRow, EASEmptyBranchRow } from '../components/EASUpdatesRows';
import { EmptyBranchesMessage } from '../components/EmptyBranchesMessage';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useUpdatesConfig } from '../providers/UpdatesConfigProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';
import { ExtensionsStackParamList } from './ExtensionsStack';

type BranchesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function BranchesScreen({ navigation }: BranchesScreenProps) {
  const { appId } = useUpdatesConfig();
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
  } = useBranchesForApp(appId);

  function onBranchPress(branchName: string) {
    navigation.navigate('Updates', { branchName });
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
    return (
      <View>
        <EmptyBranchesList
          branches={emptyBranches}
          onBranchPress={(branch) => onBranchPress(branch.name)}
        />

        {branches.length > 0 && incompatibleBranches.length > 0 && (
          <>
            <Spacer.Vertical size="small" />
            <View px="small">
              <Text size="small" color="secondary">
                {getIncompatibleBranchMessage(incompatibleBranches.length)}
              </Text>
            </View>
          </>
        )}

        {hasNextPage && <LoadMoreButton isLoading={isFetchingNextPage} onPress={fetchNextPage} />}
      </View>
    );
  }

  function EmptyList() {
    return <EmptyBranchesMessage branches={branches} incompatibleBranches={incompatibleBranches} />;
  }

  function renderBranch({ index, item: branch }: { index: number; item: Branch }) {
    const isFirst = index === 0;
    const isLast = index === branches?.length - 1;

    return (
      <ButtonContainer onPress={() => onBranchPress(branch.name)} isFirst={isFirst} isLast={isLast}>
        <EASBranchRow branch={branch} />
      </ButtonContainer>
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
        ListEmptyComponent={EmptyList}
      />
    </View>
  );
}

function ButtonContainer({ children, onPress, isFirst, isLast }) {
  return (
    <Button.ScaleOnPressContainer
      bg="default"
      onPress={onPress}
      roundedBottom={isLast ? 'large' : 'none'}
      roundedTop={isFirst ? 'large' : 'none'}>
      <View
        bg="default"
        roundedTop={isFirst ? 'large' : 'none'}
        roundedBottom={isLast ? 'large' : 'none'}
        py="small"
        px="small">
        {children}
      </View>
    </Button.ScaleOnPressContainer>
  );
}

type EmptyBranchesListProps = {
  branches: Branch[];
  onBranchPress: (branch: Branch) => void;
};

function EmptyBranchesList({ branches, onBranchPress }: EmptyBranchesListProps) {
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
            <ButtonContainer
              onPress={() => onBranchPress(branch)}
              isFirst={isFirst}
              isLast={isLast}>
              <EASEmptyBranchRow branch={branch} />
            </ButtonContainer>
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
