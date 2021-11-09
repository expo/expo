import { StackScreenProps } from '@react-navigation/stack';
import * as React from 'react';

import AccountView from '../components/AccountView';
import { useHome_AccountDataQuery } from '../graphql/types';
import { AllStackRoutes } from '../navigation/Navigation.types';

const APP_LIMIT = 7;
const SNACK_LIMIT = 4;

export default function Account(
  props: {
    accountName: string;
  } & StackScreenProps<AllStackRoutes, 'Account'>
) {
  const query = useHome_AccountDataQuery({
    fetchPolicy: 'cache-and-network',
    variables: {
      accountName: props.accountName,
      appLimit: APP_LIMIT,
      snackLimit: SNACK_LIMIT,
    },
  });
  return <AccountView {...props} {...query} />;
}
