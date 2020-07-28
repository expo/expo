import { StackScreenProps } from '@react-navigation/stack';
import { AllStackRoutes } from '../navigation/Navigation.types';
import * as React from 'react';

import { MySnacksList, OtherSnacksList } from '../containers/SnacksList';

export default function SnacksForUserScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'SnacksForUser'>) {
  const { username, belongsToCurrentUser = false } = route.params ?? {};

  if (belongsToCurrentUser) {
    return <MySnacksList />;
  }

  return <OtherSnacksList username={username} />;
}
