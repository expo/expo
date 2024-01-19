import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { BranchList } from './BranchList';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function BranchListScreen({ route }: StackScreenProps<HomeStackRoutes, 'Branches'>) {
  const { appId } = route.params ?? {};

  return <BranchList appId={appId} />;
}
