import * as React from 'react';

import MyProjectsListContainer from '../containers/MyProjectsListContainer';
import OtherUserProjectListContainer from '../containers/OtherUserProjectListContainer';
import { StackScreenProps } from '@react-navigation/stack';

type Links = { ProjectsForUser: { username: string; belongsToCurrentUser?: boolean } };

export default function ProjectsForUserScreen({
  route,
}: StackScreenProps<Links, 'ProjectsForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MyProjectsListContainer belongsToCurrentUser />;
  }
  return <OtherUserProjectListContainer username={username} />;
}
