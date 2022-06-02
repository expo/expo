import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { SnacksList } from './SnacksList';

export function SnacksListScreen({ route }: StackScreenProps<HomeStackRoutes, 'SnacksList'>) {
  const { accountName } = route.params ?? {};

  return <SnacksList accountName={accountName} />;
}
