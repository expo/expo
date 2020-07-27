import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import MyProjectsListContainer from '../containers/MyProjectsListContainer';
import OtherUserProjectListContainer from '../containers/OtherUserProjectListContainer';

export default function ProjectsForUserScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'ProjectsForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MyProjectsListContainer belongsToCurrentUser />;
  }
  return <OtherUserProjectListContainer username={username} />;
}
