import { useQuery } from '@apollo/client';
import { getRuntimeVersionForSDKVersion } from '@expo/sdk-runtime-versions';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import ProjectView from '../components/ProjectView';
import { AppPlatform, WebContainerProjectPage_QueryDocument } from '../graphql/types';
import * as Kernel from '../kernel/Kernel';
import { AllStackRoutes } from '../navigation/Navigation.types';

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<AllStackRoutes, 'Project'>
) {
  const query = useQuery(WebContainerProjectPage_QueryDocument, {
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
