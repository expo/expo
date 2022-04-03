import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, FlatList } from 'react-native';

import { SectionHeader } from '../../components/SectionHeader';
import { UpdateListItem } from '../../components/UpdateListItem';
import { BranchDetailsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { BranchHeader } from './BranchHeader';
import { EmptySection } from './EmptySection';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: BranchDetailsQuery;
} & StackScreenProps<HomeStackRoutes, 'BranchDetails'>;

export function BranchDetailsView({ loading, error, data }: Props) {
  const theme = useExpoTheme();

  let contents;

  if (error && !data?.app?.byId.updateBranchByName) {
    console.error(error);
    contents = (
      <Text
        align="center"
        style={{ marginVertical: spacing[4], marginHorizontal: spacing[4] }}
        type="InterRegular">
        {ERROR_TEXT}
      </Text>
    );
  } else if (loading || !data?.app?.byId.updateBranchByName) {
    contents = (
      <View flex="1" align="centered">
        <ActivityIndicator size="large" color={theme.highlight.accent} />
      </View>
    );
  } else {
    contents = (
      <View style={{ flex: 1, backgroundColor: theme.background.screen }}>
        <BranchHeader
          name={data.app.byId.updateBranchByName.name}
          manifestPermalink={data.app.byId.updateBranchByName.updates[0].manifestPermalink}
        />
        <FlatList<typeof data.app.byId.updateBranchByName.updates[number]>
          data={data.app.byId.updateBranchByName.updates}
          contentContainerStyle={{ padding: spacing[4] }}
          ListHeaderComponent={<SectionHeader header="Updates" style={{ paddingTop: 0 }} />}
          keyExtractor={(update) => update.id}
          ItemSeparatorComponent={() => <Spacer.Vertical size="small" />}
          renderItem={({ item: update }) => (
            <UpdateListItem
              id={update.id}
              message={update.message ?? undefined}
              manifestPermalink={update.manifestPermalink}
              createdAt={update.createdAt}
            />
          )}
        />
        {!data.app.byId.updateBranchByName!.updates.length && <EmptySection />}
      </View>
    );
  }

  return <View flex="1">{contents}</View>;
}
