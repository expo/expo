import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { ProjectView } from './ProjectView';
import { AppPlatform, useProjectsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function ProjectContainer(
  props: { appId: string } & StackScreenProps<HomeStackRoutes, 'ProjectDetails'>
) {
  const query = useProjectsQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      appId: props.appId,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
    },
  });
  return <ProjectView {...props} {...query} />;
}
