import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { BranchList } from './BranchList';

export function BranchListScreen({ route }: StackScreenProps<HomeStackRoutes, 'Branches'>) {
  const { appId } = route.params ?? {};

  return <BranchList appId={appId} />;
}
