import { NetworkStatus } from '@apollo/client';
import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { Divider, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, RefreshControl, FlatList } from 'react-native';

import { BranchHeader } from './BranchHeader';
import { EmptySection } from './EmptySection';
import { SectionHeader } from '../../components/SectionHeader';
import { UpdateListItem } from '../../components/UpdateListItem';
import { BranchDetailsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { useThrottle } from '../../utils/useThrottle';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: BranchDetailsQuery;
  branchName: string;
  networkStatus: number;
  refetch: () => Promise<unknown>;
} & StackScreenProps<HomeStackRoutes, 'BranchDetails'>;

export function BranchDetailsView({ error, data, refetch, branchName, networkStatus }: Props) {
  const theme = useExpoTheme();

  const refetching = useThrottle(networkStatus === NetworkStatus.refetch, 800);

  if (error && !data?.app?.byId.updateBranchByName) {
    console.error(error);
    return (
      <View flex="1" align="centered">
        <Text
          align="center"
          style={{ marginVertical: spacing[4], marginHorizontal: spacing[4] }}
          type="InterRegular">
          {ERROR_TEXT}
        </Text>
      </View>
    );
  }

  if (networkStatus === NetworkStatus.loading || !data?.app?.byId.updateBranchByName) {
    return (
      <View flex="1" align="centered">
        <ActivityIndicator size="large" color={theme.highlight.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background.screen }}>
      <BranchHeader name={branchName} latestUpdate={data.app.byId.updateBranchByName.updates[0]} />
      <FlatList
        data={data.app.byId.updateBranchByName.updates}
        refreshControl={<RefreshControl onRefresh={refetch} refreshing={refetching} />}
        ListHeaderComponent={<SectionHeader header="Updates" style={{ paddingTop: 0 }} />}
        keyExtractor={(update) => update.id}
        contentContainerStyle={{ padding: spacing[4] }}
        ItemSeparatorComponent={() => <Divider style={{ height: 1 }} />}
        ListEmptyComponent={() => <EmptySection />}
        renderItem={({ item: update, index }) => (
          <UpdateListItem
            key={update.id}
            update={update}
            first={index === 0}
            last={index === (data.app.byId.updateBranchByName?.updates ?? []).length - 1}
          />
        )}
      />
    </View>
  );
}
