import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { ProjectContainer } from './ProjectContainer';

export function ProjectScreen(props: StackScreenProps<HomeStackRoutes, 'ProjectDetails'>) {
  const { id } = props.route.params;

  return <ProjectContainer {...props} appId={id} />;
}
