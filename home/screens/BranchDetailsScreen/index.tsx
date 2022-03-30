import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { HomeStackRoutes } from '../../navigation/Navigation.types';
import { BranchDetailsContainer } from './BranchDetailsContainer';

export function BranchDetailsScreen(props: StackScreenProps<HomeStackRoutes, 'BranchDetails'>) {
  const { appId, branchName } = props.route.params;

  return <BranchDetailsContainer {...props} appId={appId} branchName={branchName} />;
}
