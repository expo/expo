import { StackScreenProps } from '@react-navigation/stack';
import { HomeStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import { ProjectContainer } from './ProjectContainer';

export function RedesignedProjectScreen(
  props: StackScreenProps<HomeStackRoutes, 'RedesignedProjectDetails'>
) {
  const { id } = props.route.params;

  return <ProjectContainer {...props} appId={id} />;
}
