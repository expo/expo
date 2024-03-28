import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';
import { Platform } from 'react-native';

import { BranchDetailsView } from './BranchDetailsView';
import { AppPlatform, useBranchDetailsQuery } from '../../graphql/types';
import { HomeStackRoutes } from '../../navigation/Navigation.types';

export function BranchDetailsContainer(
  props: { appId: string; branchName: string } & StackScreenProps<HomeStackRoutes, 'BranchDetails'>
) {
  const query = useBranchDetailsQuery({
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    variables: {
      appId: props.appId,
      name: props.branchName,
      platform: Platform.OS === 'ios' ? AppPlatform.Ios : AppPlatform.Android,
    },
  });

  return <BranchDetailsView {...props} {...query} />;
}
