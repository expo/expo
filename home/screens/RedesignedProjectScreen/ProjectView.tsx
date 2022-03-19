import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import dedent from 'dedent';
import { View } from 'expo-dev-client-components';
import * as React from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View as RNView } from 'react-native';
import semver from 'semver';

import ListItem from '../../components/ListItem';
import ScrollView from '../../components/NavigationScrollView';
import { RedesignedSectionHeader } from '../../components/RedesignedSectionHeader';
import SectionHeader from '../../components/SectionHeader';
import ShareProjectButton from '../../components/ShareProjectButton';
import { StyledText } from '../../components/Text';
import SharedStyles from '../../constants/SharedStyles';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import Environment from '../../utils/Environment';
import * as UrlUtils from '../../utils/UrlUtils';
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
type ProjectUpdateBranch = WebContainerProjectPage_Query['app']['byId']['updateBranches'][0];

export function ProjectView({ loading, error, data, navigation }: Props) {
  let contents;
  if (error && !data?.app?.byId) {
    console.log(error);
    contents = (
      <StyledText
        style={SharedStyles.noticeDescriptionText}
        lightColor="rgba(36, 44, 58, 0.7)"
        darkColor="#ccc">
        {ERROR_TEXT}
      </StyledText>
    );
  } else if (loading || !data?.app?.byId) {
    contents = (
      <RNView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </RNView>
    );
  } else {
    const app = data.app.byId;

    contents = (
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <ProjectHeader app={app} />
        <View padding="medium">
          {(appHasLegacyUpdate(app) || appHasEASUpdates(app)) && (
            <RedesignedSectionHeader header="Launch project" style={{ paddingTop: 0 }} />
          )}
          {appHasLegacyUpdate(app) && <LegacyLaunchSection app={app} />}
          {appHasEASUpdates(app) && <NewLaunchSection app={app} />}
          {!appHasLegacyUpdate(app) && !appHasEASUpdates(app) && <EmptySection />}
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

  return <RNView style={{ flex: 1 }}>{contents}</RNView>;
}

function truthy<TValue>(value: TValue | null | undefined): value is TValue {
  return !!value;
}

function getSDKMajorVersionForEASUpdateBranch(branch: ProjectUpdateBranch): number | null {
  const updates = branch.updates;
  if (updates.length === 0) {
    return null;
  }

  return (
    updates
      .map((update) => {
        const potentialSDKVersion = getSDKVersionFromRuntimeVersion(update.runtimeVersion);
        return potentialSDKVersion ? semver.major(potentialSDKVersion) : null;
      })
      .filter(truthy)
      .sort((a, b) => b - a)[0] ?? null
  );
}

function appHasLegacyUpdate(app: ProjectPageApp): boolean {
  return app.published;
}

function appHasEASUpdates(app: ProjectPageApp): boolean {
  return app.updateBranches.some((branch) => branch.updates.length > 0);
}

function NewLaunchSection({ app }: { app: ProjectPageApp }) {
  const branchesToRender = app.updateBranches.filter(
    (updateBranch) => updateBranch.updates.length > 0
  );

  const branchManifests = branchesToRender.map((branch) => ({
    branchName: branch.name,
    manifestUrl: branch.updates[0].manifestPermalink,
    sdkVersion: getSDKMajorVersionForEASUpdateBranch(branch),
  }));

  const renderBranchManifest = (
    branchManifest: { branchName: string; manifestUrl: string; sdkVersion: number | null },
    index: number
  ) => {
    const isLatestLegacyPublishDeprecated =
      branchManifest.sdkVersion !== null &&
      branchManifest.sdkVersion < Environment.lowestSupportedSdkVersion;

    return (
      <ListItem
        key={`branch-${branchManifest.branchName}`}
        title={branchManifest.branchName}
        onPress={() => {
          if (isLatestLegacyPublishDeprecated) {
            Alert.alert(
              `This branch's SDK version (${branchManifest.sdkVersion}) is no longer supported.`
            );
          } else {
            Linking.openURL(UrlUtils.toExps(branchManifest.manifestUrl));
          }
        }}
        last={index === branchManifests.length - 1}
      />
    );
  };

  return (
    <RNView>
      <SectionHeader title="EAS branches" />
      {branchManifests.map(renderBranchManifest)}
    </RNView>
  );
}

const styles = StyleSheet.create({
  containerShape: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
  },
  itemMargins: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  descriptionText: {
    marginHorizontal: 30,
    marginBottom: 20,
    textAlign: 'center',
  },
  container: {
    flex: 1,
  },
  header: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatarContainer: {
    overflow: 'hidden',
    borderRadius: 5,
  },
  headerAvatar: {
    height: 64,
    width: 64,
    borderRadius: 5,
  },
  legacyHeaderAvatar: {
    backgroundColor: '#eee',
  },
  headerInfoContainer: {
    marginLeft: 15,
  },
  headerAccountText: {
    fontSize: 14,
  },
  headerNameText: {
    fontSize: 20,
    fontWeight: '500',
  },
});
