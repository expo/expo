import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import { ProjectContainer } from '../containers/Project';

export default function ProjectScreen(props: StackScreenProps<AllStackRoutes, 'Project'>) {
  const { id } = props.route.params;

  return <ProjectContainer {...props} appId={id} />;
}
