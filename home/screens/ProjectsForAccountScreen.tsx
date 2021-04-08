import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import ProjectsList from '../containers/ProjectsList';

export default function ProjectsForAccountScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'ProjectsForAccount'>) {
  const { accountName } = route.params ?? {};

  return <ProjectsList accountName={accountName} />;
}
