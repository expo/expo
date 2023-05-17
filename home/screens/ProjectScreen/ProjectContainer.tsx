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
      sdkVersions: Kernel.sdkVersions.split(','),
    },
  });
  return <ProjectView {...props} {...query} />;
}
