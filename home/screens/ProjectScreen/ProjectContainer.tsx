import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { AppPlatform, useWebContainerProjectPage_Query } from '../../graphql/types';
import * as Kernel from '../../kernel/Kernel';
import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { ProjectView } from './ProjectView';

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<HomeStackRoutes, 'ProjectDetails'>
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
