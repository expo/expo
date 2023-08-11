import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import { BranchDetailsContainer } from './BranchDetailsContainer';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function BranchDetailsScreen(props: StackScreenProps<HomeStackRoutes, 'BranchDetails'>) {
  const { appId, branchName } = props.route.params;

  return <BranchDetailsContainer {...props} appId={appId} branchName={branchName} />;
}
