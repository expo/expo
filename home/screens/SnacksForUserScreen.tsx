import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from 'navigation/Navigation.types';
import * as React from 'react';

import MySnacksListContainer from '../containers/MySnacksListContainer';
import OtherUserSnackListContainer from '../containers/OtherUserSnackListContainer';

export default function SnacksForUserScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'SnacksForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MySnacksListContainer belongsToCurrentUser />;
  }

  return <OtherUserSnackListContainer username={username} />;
}
