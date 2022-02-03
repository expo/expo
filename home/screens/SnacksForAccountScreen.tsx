import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import SnacksList from '../containers/SnacksList';
import { AllStackRoutes } from '../navigation/Navigation.types';

export default function SnacksForAccountScreen({
  route,
}: StackScreenProps<AllStackRoutes, 'SnacksForAccount'>) {
  const { accountName } = route.params ?? {};

  return <SnacksList accountName={accountName} />;
}
