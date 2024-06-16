import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { ProjectContainer } from './ProjectContainer';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function ProjectScreen(props: StackScreenProps<HomeStackRoutes, 'ProjectDetails'>) {
  const { id } = props.route.params;

  return <ProjectContainer {...props} appId={id} />;
}
