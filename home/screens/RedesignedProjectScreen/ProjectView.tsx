import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { Divider, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';

import { ConstantItem } from '../../components/ConstantItem';
import ScrollView from '../../components/NavigationScrollView';
import { RedesignedSectionHeader } from '../../components/RedesignedSectionHeader';
import ShareProjectButton from '../../components/ShareProjectButton';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { EASUpdateLaunchSection } from './EASUpdateLaunchSection';
import { EmptySection } from './EmptySection';
import { LegacyLaunchSection } from './LegacyLaunchSection';
import { ProjectHeader } from './ProjectHeader';

const ERROR_TEXT = dedent`
  An unexpected error has occurred.
  Sorry about this. We will resolve the issue as soon as possible.
`;

type Props = {
  loading: boolean;
  error?: Error;
  data?: WebContainerProjectPage_Query;
} & StackScreenProps<HomeStackRoutes, 'RedesignedProjectDetails'>;

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
        <ProjectHeader app={app} />
        <View padding="medium">
          {(appHasLegacyUpdate(app) || appHasEASUpdates(app)) && (
            <RedesignedSectionHeader header="Launch project" style={{ paddingTop: 0 }} />
          )}
          {appHasLegacyUpdate(app) && <LegacyLaunchSection app={app} />}
          {appHasEASUpdates(app) && <EASUpdateLaunchSection app={app} />}
          {!appHasLegacyUpdate(app) && !appHasEASUpdates(app) && <EmptySection />}
          <Spacer.Vertical size="medium" />
          <View bg="default" border="hairline" overflow="hidden" rounded="large">
            <ConstantItem title="Owner" value={app.username} />
            <Divider />
            <ConstantItem title="SDK Version" value={app.sdkVersion} />
            <Divider />
            <ConstantItem title="Privacy" value={app.privacy} />
          </View>
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

function appHasLegacyUpdate(app: ProjectPageApp): boolean {
  return app.published;
}

function appHasEASUpdates(app: ProjectPageApp): boolean {
  return app.updateBranches.some((branch) => branch.updates.length > 0);
}
