import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import { MyProjectsList, OtherProjectsList } from '../containers/ProjectsList';

export default function ProjectsForUserScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'ProjectsForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MyProjectsList />;
  }
  return <OtherProjectsList username={username} />;
}
