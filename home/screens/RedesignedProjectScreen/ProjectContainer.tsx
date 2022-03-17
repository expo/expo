import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import ProjectView from './ProjectView';
import { AppPlatform, useWebContainerProjectPage_Query } from '../../graphql/types';
import * as Kernel from '../../kernel/Kernel';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<HomeStackRoutes, 'RedesignedProjectDetails'>
) {
  const query = useWebContainerProjectPage_Query({
    fetchPolicy: 'cache-and-network',
    variables: {
      appId: props.appId,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
      runtimeVersions: Kernel.sdkVersions
        .split(',')
        .map((kernelSDKVersion) => getRuntimeVersionForSDKVersion(kernelSDKVersion)),
    },
  });
  return <ProjectView {...props} {...query} />;
}
