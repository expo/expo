import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { AppPlatform, useBranchDetailsQuery } from '../../graphql/types';
import * as Kernel from '../../kernel/Kernel';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { BranchDetailsView } from './BranchDetailsView';

export function BranchDetailsContainer(
  props: { appId: string; branchName: string } & StackScreenProps<HomeStackRoutes, 'BranchDetails'>
) {
  const query = useBranchDetailsQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: {
      appId: props.appId,
      name: props.branchName,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
      runtimeVersions: Kernel.sdkVersions
        .split(',')
        .map((kernelSDKVersion) => getRuntimeVersionForSDKVersion(kernelSDKVersion)),
    },
  });

  return <BranchDetailsView {...props} {...query} />;
}
