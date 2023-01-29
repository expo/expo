import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { AppPlatform, useBranchesForProjectQuery } from '../../graphql/types';
import * as Kernel from '../../kernel/Kernel';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { getSDKMajorVersionForEASUpdateBranch } from '../ProjectScreen/EASUpdateLaunchSection';
import { BranchListView } from './BranchListView';

function useBranchesQuery({
  appId,
  platform,
  runtimeVersions,
}: {
  appId: string;
  platform: AppPlatform;
  runtimeVersions: string[];
}) {
  const { data, fetchMore } = useBranchesForProjectQuery({
    variables: {
      appId,
      platform,
      runtimeVersions,
      limit: 15,
      offset: 0,
    },
    fetchPolicy: 'cache-and-network',
  });
  const navigation = useNavigation<StackNavigationProp<HomeStackRoutes>>();

  const app = data?.app.byId;

  const branchesToRender = (app?.updateBranches ?? []).filter(
    (updateBranch) => updateBranch.updates.length > 0
  );

  const branchManifests = branchesToRender.map((branch) => ({
    name: branch.name,
    id: branch.id,
    latestUpdate: branch.updates[0],
    sdkVersion: getSDKMajorVersionForEASUpdateBranch(branch),
  }));

  const loadMoreAsync = React.useCallback(() => {
    return fetchMore({
      variables: {
        offset: app?.updateBranches.length || 0,
      },
    });
  }, [fetchMore, app]);

  React.useEffect(() => {
    if (data?.app?.byId) {
      const fullName = data?.app.byId.fullName;
      const title = `Branches - ${data?.app.byId.name ?? fullName}`;
      navigation.setOptions({
        title,
      });
    }
  }, [navigation, data?.app?.byId]);

  return {
    branchManifests,
    loadMoreAsync,
  };
}

export function BranchList({ appId }: { appId: string }) {
  const { branchManifests, loadMoreAsync } = useBranchesQuery({
    appId,
    platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
    runtimeVersions: Kernel.sdkVersions
      .split(',')
      .map((kernelSDKVersion) => getRuntimeVersionForSDKVersion(kernelSDKVersion)),
  });

  return <BranchListView data={branchManifests} appId={appId} loadMoreAsync={loadMoreAsync} />;
}
