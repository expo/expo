import { useQuery } from '@apollo/client';
import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import AccountView from '../components/AccountView';
import { Project } from '../components/ProjectList';
import { Snack } from '../components/SnackList';
import { Home_AccountDataDocument } from '../graphql/types';
import { AllStackRoutes } from '../navigation/Navigation.types';

const APP_LIMIT = 7;
const SNACK_LIMIT = 4;

export interface AccountData {
  account: {
    byName: {
      id: string;
      name: string;
      appCount: number;
      apps: Project[];
      snacks: Snack[];
    };
  };
}

export default function Account(
  props: {
    accountName: string;
  } & StackScreenProps<AllStackRoutes, 'Account'>
) {
  const query = useQuery(Home_AccountDataDocument, {
    fetchPolicy: 'cache-and-network',
    variables: {
      accountName: props.accountName,
      appLimit: APP_LIMIT,
      snackLimit: SNACK_LIMIT,
    },
  });
  return <AccountView {...props} {...query} />;
}
