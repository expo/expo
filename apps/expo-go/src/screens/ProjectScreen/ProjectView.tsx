import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';
import { SectionHeader } from 'src/components/SectionHeader';

import { EASUpdateLaunchSection } from './EASUpdateLaunchSection';
import { ProjectHeader } from './ProjectHeader';
import ScrollView from '../../components/NavigationScrollView';
import ShareProjectButton from '../../components/ShareProjectButton';
import { ProjectsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: ProjectsQuery;
} & StackScreenProps<HomeStackRoutes, 'ProjectDetails'>;

export function ProjectView({ loading, error, data, navigation }: Props) {
  const theme = useExpoTheme();

  let contents;
  if (error && !data?.app?.byId) {
    console.log(error);
    contents = (
      <Text
        align="center"
        style={{ marginBottom: spacing[4], marginHorizontal: spacing[4] }}
        type="InterRegular">
        {ERROR_TEXT}
      </Text>
    );
  } else if (loading || !data?.app?.byId) {
    contents = (
      <View flex="1" align="centered">
        <ActivityIndicator size="large" color={theme.highlight.accent} />
      </View>
    );
  } else {
    const app = data.app.byId;

    contents = (
      <ScrollView style={{ flex: 1 }}>
        <ProjectHeader app={app} />
        <View padding="medium">
          <SectionHeader header="Branches" style={{ paddingTop: 0 }} />
          <EASUpdateLaunchSection app={app} />
          <Spacer.Vertical size="xl" />
        </View>
      </ScrollView>
    );
  }

  React.useEffect(() => {
    if (data?.app?.byId) {
      const fullName = data?.app.byId.fullName;
      const title = data?.app.byId.name ?? fullName;
      navigation.setOptions({
        title,
        headerRight: () => <ShareProjectButton fullName={fullName} />,
      });
    }
  }, [navigation, data?.app?.byId]);

  return <View flex="1">{contents}</View>;
}
