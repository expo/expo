import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { SnacksList } from './SnacksList';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function SnacksListScreen({ route }: StackScreenProps<HomeStackRoutes, 'SnacksList'>) {
  const { accountName } = route.params ?? {};

  return <SnacksList accountName={accountName} />;
}
