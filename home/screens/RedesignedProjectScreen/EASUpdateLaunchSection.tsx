import { getSDKVersionFromRuntimeVersion } from '@expo/sdk-runtime-versions';
import * as React from 'react';
import { Alert, Linking, View as RNView } from 'react-native';
import semver from 'semver';

import ListItem from '../../components/ListItem';
import SectionHeader from '../../components/SectionHeader';
import { WebContainerProjectPage_Query } from '../../graphql/types';
import Environment from '../../utils/Environment';
import * as UrlUtils from '../../utils/UrlUtils';

type ProjectPageApp = WebContainerProjectPage_Query['app']['byId'];
type ProjectUpdateBranch = WebContainerProjectPage_Query['app']['byId']['updateBranches'][0];

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

export function EASUpdateLaunchSection({ app }: { app: ProjectPageApp }) {
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
