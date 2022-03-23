import { StackNavigationProp } from '@react-navigation/stack';
import { Heading, View, Button, Divider, Spacer } from 'expo-dev-client-components';
import * as React from 'react';

import { EASBranchRow, EASEmptyBranchRow } from '../components/EASUpdatesRows';
import { FlatList } from '../components/FlatList';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { useBuildInfo } from '../providers/BuildInfoProvider';
import { Branch, useBranchesForApp } from '../queries/useBranchesForApp';
import { ExtensionsStackParamList } from './ExtensionsStack';

type BranchesScreenProps = {
  navigation: StackNavigationProp<ExtensionsStackParamList>;
};

export function BranchesScreen({ navigation }: BranchesScreenProps) {
  const { appId } = useBuildInfo();
  const {
    data: branches,
    emptyBranches,
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
        {hasNextPage && <LoadMoreButton isLoading={isFetchingNextPage} onPress={fetchNextPage} />}
      </View>
    );
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
