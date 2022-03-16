import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { SnacksList } from './SnacksList';

export function RedesignedSnacksListScreen({
  route,
}: StackScreenProps<HomeStackRoutes, 'RedesignedSnacksList'>) {
  const { accountName } = route.params ?? {};

  return <SnacksList accountName={accountName} />;
}
