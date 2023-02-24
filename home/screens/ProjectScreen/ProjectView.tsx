import { spacing } from '@expo/styleguide-native';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { Divider, Spacer, Text, useExpoTheme, View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator } from 'react-native';

import { ConstantItem } from '../../components/ConstantItem';
import ScrollView from '../../components/NavigationScrollView';
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
} & StackScreenProps<HomeStackRoutes, 'ProjectDetails'>;

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
      <ScrollView style={{ flex: 1 }}>
        <ProjectHeader app={app} />
        <View padding="medium">
          {appHasEASUpdates(app) && (
            <>
              <EASUpdateLaunchSection app={app} />
              <Spacer.Vertical size="xl" />
            </>
          )}
          {appHasLegacyUpdate(app) && (
            <>
              <LegacyLaunchSection app={app} />
              <Spacer.Vertical size="xl" />
            </>
          )}
          {!appHasLegacyUpdate(app) && !appHasEASUpdates(app) && (
            <>
              <EmptySection />
              <Spacer.Vertical size="xl" />
            </>
          )}
          <View bg="default" border="default" overflow="hidden" rounded="large">
            <ConstantItem title="Owner" value={app.username} />
            {app.sdkVersion !== '0.0.0' && (
              <>
                <Divider style={{ height: 1 }} />
                <ConstantItem title="SDK Version" value={app.sdkVersion} />
              </>
            )}
            {app.latestReleaseForReleaseChannel?.runtimeVersion && (
              <>
                <Divider style={{ height: 1 }} />
                <ConstantItem
                  title="Runtime Version"
                  value={app.latestReleaseForReleaseChannel?.runtimeVersion}
                />
              </>
            )}
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
